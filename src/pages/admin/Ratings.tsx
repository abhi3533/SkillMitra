import { useState, useEffect } from "react";
import { Star, AlertTriangle, Trash2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminRatings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [stats, setStats] = useState({ avgRating: 0, monthReviews: 0, flaggedCount: 0 });
  const [flaggedTrainers, setFlaggedTrainers] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const { data: allRatings } = await supabase.from("ratings").select("*").order("created_at", { ascending: false });
    const ratingsData = allRatings || [];

    // Get unique user IDs from students and trainers tables
    const studentIds = [...new Set(ratingsData.map(r => r.student_id))];
    const trainerIds = [...new Set(ratingsData.map(r => r.trainer_id))];

    // Fetch students and trainers to get user_ids
    const [{ data: students }, { data: trainers }] = await Promise.all([
      supabase.from("students").select("id, user_id").in("id", studentIds.length ? studentIds : [""]),
      supabase.from("trainers").select("id, user_id, average_rating").in("id", trainerIds.length ? trainerIds : [""]),
    ]);

    const allUserIds = [
      ...(students || []).map(s => s.user_id),
      ...(trainers || []).map(t => t.user_id),
    ];

    const { data: profilesData } = await supabase.from("profiles").select("id, full_name").in("id", allUserIds.length ? allUserIds : [""]);
    
    const profileMap: Record<string, any> = {};
    (profilesData || []).forEach(p => { profileMap[p.id] = p; });
    
    // Map student_id -> profile name, trainer_id -> profile name
    const studentUserMap: Record<string, string> = {};
    (students || []).forEach(s => { studentUserMap[s.id] = profileMap[s.user_id]?.full_name || "Student"; });
    const trainerUserMap: Record<string, string> = {};
    (trainers || []).forEach(t => { trainerUserMap[t.id] = profileMap[t.user_id]?.full_name || "Trainer"; });

    setProfiles({ students: studentUserMap, trainers: trainerUserMap });
    setRatings(ratingsData);

    // Stats
    const withStudentRating = ratingsData.filter(r => r.student_to_trainer_rating);
    const avg = withStudentRating.length > 0 ? withStudentRating.reduce((s, r) => s + r.student_to_trainer_rating, 0) / withStudentRating.length : 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthReviews = ratingsData.filter(r => new Date(r.created_at) >= monthStart).length;
    
    // Flagged trainers (below 3.5)
    const flagged = (trainers || []).filter(t => Number(t.average_rating) > 0 && Number(t.average_rating) < 3.5);
    setFlaggedTrainers(flagged.map(t => ({ ...t, name: trainerUserMap[t.id] })));

    setStats({ avgRating: Math.round(avg * 10) / 10, monthReviews, flaggedCount: flagged.length });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const deleteRating = async (id: string) => {
    await supabase.from("ratings").delete().eq("id", id);
    toast({ title: "Rating deleted" });
    fetchData();
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Ratings Management</h1>
      <p className="mt-1 text-muted-foreground">Monitor and manage all platform ratings</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { label: "Avg Platform Rating", value: loading ? "-" : `${stats.avgRating}★` },
          { label: "Reviews This Month", value: loading ? "-" : String(stats.monthReviews) },
          { label: "Flagged Trainers", value: loading ? "-" : String(stats.flaggedCount) },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border p-5">
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Flagged Trainers */}
      {flaggedTrainers.length > 0 && (
        <div className="mt-6 bg-destructive/5 border border-destructive/20 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-destructive flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Flagged Trainers (Below 3.5★)</h2>
          <div className="mt-3 space-y-2">
            {flaggedTrainers.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                <div>
                  <p className="font-medium text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">Rating: {t.average_rating}★</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs">Warn</Button>
                  <Button size="sm" variant="destructive" className="text-xs">Suspend</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Ratings Table */}
      <div className="mt-6 bg-card rounded-xl border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">All Ratings</h2>
        </div>
        {loading ? <div className="h-32 skeleton m-4 rounded-lg" /> : ratings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No ratings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Student</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Trainer</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Student→Trainer</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Trainer→Student</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Review</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="p-3 text-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="p-3 text-foreground">{profiles.students?.[r.student_id] || "-"}</td>
                    <td className="p-3 text-foreground">{profiles.trainers?.[r.trainer_id] || "-"}</td>
                    <td className="p-3">
                      {r.student_to_trainer_rating ? (
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-accent fill-accent" />{r.student_to_trainer_rating}</span>
                      ) : "-"}
                    </td>
                    <td className="p-3">
                      {r.trainer_to_student_rating ? (
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-accent fill-accent" />{r.trainer_to_student_rating}</span>
                      ) : "-"}
                    </td>
                    <td className="p-3 text-muted-foreground max-w-[200px] truncate">{r.student_review_text || r.student_to_trainer_review || "-"}</td>
                    <td className="p-3">
                      <button onClick={() => deleteRating(r.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRatings;
