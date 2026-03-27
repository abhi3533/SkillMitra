import { useState, useEffect } from "react";
import { CalendarCheck, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { formatDateIST } from "@/lib/dateUtils";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminTrialBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("trial_bookings")
        .select("*, courses(title)")
        .order("created_at", { ascending: false });

      const rows = data || [];
      if (rows.length > 0) {
        const studentIds = rows.map(b => b.student_id);
        const trainerIds = rows.map(b => b.trainer_id);
        const [{ data: students }, { data: trainers }] = await Promise.all([
          supabase.from("students").select("id, user_id").in("id", studentIds),
          supabase.from("trainers").select("id, user_id").in("id", trainerIds),
        ]);
        const allUserIds = [
          ...(students || []).map(s => s.user_id),
          ...(trainers || []).map(t => t.user_id),
        ];
        const profileMap = await fetchProfilesMap(allUserIds);
        const studentMap: Record<string, string> = {};
        (students || []).forEach(s => { studentMap[s.id] = profileMap[s.user_id]?.full_name || "Student"; });
        const trainerMap: Record<string, string> = {};
        (trainers || []).forEach(t => { trainerMap[t.id] = profileMap[t.user_id]?.full_name || "Trainer"; });
        setBookings(rows.map(b => ({
          ...b,
          studentName: studentMap[b.student_id] || "Student",
          trainerName: trainerMap[b.trainer_id] || "Trainer",
        })));
      }
      setLoading(false);
    })();
  }, []);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      approved: "bg-emerald-100 text-emerald-700",
      rejected: "bg-red-100 text-red-700",
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || "bg-muted text-muted-foreground"}`}>{status}</span>;
  };

  const filtered = bookings
    .filter(b => tab === "all" || b.status === tab)
    .filter(b => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (b.studentName?.toLowerCase().includes(q) || b.trainerName?.toLowerCase().includes(q) || b.courses?.title?.toLowerCase().includes(q));
    });

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    approved: bookings.filter(b => b.status === "approved").length,
    rejected: bookings.filter(b => b.status === "rejected").length,
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Trial Bookings</h1>
      <p className="mt-1 text-muted-foreground">All free trial requests across the platform</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { label: "Total", value: counts.all, color: "text-foreground" },
          { label: "Pending", value: counts.pending, color: "text-amber-600" },
          { label: "Approved", value: counts.approved, color: "text-emerald-600" },
          { label: "Rejected", value: counts.rejected, color: "text-destructive" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border p-4">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by student, trainer or course..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Trainer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Course</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Requested</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Responded</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center">
                  <CalendarCheck className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground mt-2 text-sm">No trial bookings found</p>
                </td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-secondary/20">
                  <td className="px-4 py-3 text-sm text-foreground font-medium">{b.studentName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{b.trainerName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{b.courses?.title || "-"}</td>
                  <td className="px-4 py-3">{statusBadge(b.status)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateIST(b.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{b.responded_at ? formatDateIST(b.responded_at) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTrialBookings;
