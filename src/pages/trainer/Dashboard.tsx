import { useState, useEffect } from "react";
import { Users, DollarSign, Calendar, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TrainerLayout from "@/components/layouts/TrainerLayout";

const TrainerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ activeStudents: 0, monthEarnings: 0, totalSessions: 0, avgRating: 0, todaySessions: [] as any[], reviews: [] as any[] });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: trainer } = await supabase.from("trainers").select("id, average_rating").eq("user_id", user.id).single();
      if (!trainer) { setLoading(false); return; }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const [enrollRes, sessRes, earningsRes, todayRes, reviewsRes] = await Promise.all([
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("trainer_id", trainer.id).eq("status", "active"),
        supabase.from("course_sessions").select("id", { count: "exact", head: true }).eq("trainer_id", trainer.id),
        supabase.from("enrollments").select("trainer_payout").eq("trainer_id", trainer.id).gte("enrollment_date", startOfMonth),
        supabase.from("course_sessions").select("*").eq("trainer_id", trainer.id).gte("scheduled_at", todayStart).lt("scheduled_at", todayEnd),
        supabase.from("ratings").select("*, students(*, profiles(full_name))").eq("trainer_id", trainer.id).order("created_at", { ascending: false }).limit(5),
      ]);

      const monthTotal = (earningsRes.data || []).reduce((s: number, e: any) => s + Number(e.trainer_payout || 0), 0);

      setData({
        activeStudents: enrollRes.count || 0,
        monthEarnings: monthTotal,
        totalSessions: sessRes.count || 0,
        avgRating: Number(trainer.average_rating) || 0,
        todaySessions: todayRes.data || [],
        reviews: reviewsRes.data || [],
      });
      setLoading(false);
    })();
  }, [user]);

  const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <TrainerLayout>
      <h1 className="text-2xl font-bold text-foreground">Trainer Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Manage your students, courses, and earnings</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Active Students", value: loading ? "-" : String(data.activeStudents), icon: Users },
          { label: "This Month Earnings", value: loading ? "-" : formatINR(data.monthEarnings), icon: DollarSign },
          { label: "Total Sessions", value: loading ? "-" : String(data.totalSessions), icon: Calendar },
          { label: "Avg. Rating", value: loading ? "-" : data.avgRating > 0 ? `${data.avgRating}★` : "No ratings yet", icon: Star },
        ].map(card => (
          <div key={card.label} className="bg-card rounded-xl border p-5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <card.icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Today's Sessions */}
      <div className="mt-8 bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Today's Sessions</h2>
        {loading ? <div className="h-16 skeleton rounded-lg" /> :
          data.todaySessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No sessions scheduled for today. Enjoy your day! ☀️</p>
          ) : data.todaySessions.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 mb-2 last:mb-0">
              <div>
                <p className="text-sm font-medium text-foreground">{s.title || `Session #${s.session_number}`}</p>
                <p className="text-xs text-muted-foreground">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
              </div>
            </div>
          ))
        }
      </div>

      {/* Recent Reviews */}
      <div className="mt-6 bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Reviews</h2>
        {loading ? <div className="h-16 skeleton rounded-lg" /> :
          data.reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No reviews yet. Complete your first session to receive reviews.</p>
          ) : data.reviews.map((r: any) => (
            <div key={r.id} className="p-3 rounded-lg bg-secondary/30 mb-2 last:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">{r.students?.profiles?.full_name || "Student"}</span>
                <span className="text-accent text-xs">{"★".repeat(r.student_to_trainer_rating || 0)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{r.student_to_trainer_review || "No comment"}</p>
            </div>
          ))
        }
      </div>
    </TrainerLayout>
  );
};

export default TrainerDashboard;
