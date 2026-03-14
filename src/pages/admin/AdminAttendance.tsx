import { useState, useEffect } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { ClipboardCheck, Search, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, avgRate: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("attendance").select("*, course_sessions(title, session_number, enrollment_id)").order("marked_at", { ascending: false }).limit(200);
      const attData = data || [];

      // Get student names
      const studentIds = [...new Set(attData.map(a => a.student_id))];
      const nameMap: Record<string, string> = {};
      if (studentIds.length > 0) {
        const { data: students } = await supabase.from("students").select("id, user_id").in("id", studentIds);
        const userIds = (students || []).map(s => s.user_id);
        const profileMap = await fetchProfilesMap(userIds);
        (students || []).forEach(s => { nameMap[s.id] = profileMap[s.user_id]?.full_name || "Student"; });
      }

      // Get trainer names
      const trainerIds = [...new Set(attData.map(a => a.marked_by))];
      if (trainerIds.length > 0) {
        const { data: trainers } = await supabase.from("trainers").select("id, user_id").in("id", trainerIds);
        const userIds = (trainers || []).map(t => t.user_id);
        const profileMap = await fetchProfilesMap(userIds);
        const tNameMap: Record<string, string> = {};
        (trainers || []).forEach(t => { tNameMap[t.id] = profileMap[t.user_id]?.full_name || "Trainer"; });
        setRecords(attData.map(a => ({ ...a, studentName: nameMap[a.student_id] || "Student", trainerName: tNameMap[a.marked_by] || "Trainer" })));
      } else {
        setRecords(attData.map(a => ({ ...a, studentName: nameMap[a.student_id] || "Student", trainerName: "Trainer" })));
      }

      const total = attData.length;
      const present = attData.filter(a => a.status === "present").length;
      const absent = attData.filter(a => a.status === "absent").length;
      setStats({ total, present, absent, avgRate: total > 0 ? Math.round((present / total) * 100) : 0 });
      setLoading(false);
    })();
  }, []);

  const filtered = records.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.studentName?.toLowerCase().includes(q) || r.trainerName?.toLowerCase().includes(q);
  });

  const downloadCSV = () => {
    const headers = "Student,Trainer,Session,Status,Date\n";
    const rows = filtered.map(r =>
      `"${r.studentName}","${r.trainerName}","${r.course_sessions?.title || `Session #${r.course_sessions?.session_number}`}","${r.status}","${formatDateIST(r.marked_at)}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lowAttendanceRate = stats.avgRate < 75;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform-wide attendance tracking</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={downloadCSV} disabled={loading}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Total Records", value: loading ? "–" : String(stats.total) },
          { label: "Present", value: loading ? "–" : String(stats.present), color: "text-emerald-600" },
          { label: "Absent", value: loading ? "–" : String(stats.absent), color: "text-destructive" },
          { label: "Avg Rate", value: loading ? "–" : `${stats.avgRate}%`, color: stats.avgRate >= 90 ? "text-emerald-600" : stats.avgRate >= 75 ? "text-amber-600" : "text-destructive" },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border p-5">
            <p className={`text-xl font-bold ${c.color || "text-foreground"}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {lowAttendanceRate && !loading && (
        <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">Platform average attendance is below 75%. Consider sending reminders to students.</p>
        </div>
      )}

      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student or trainer..." className="pl-10" />
      </div>

      <div className="mt-4 bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-secondary/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Student</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Trainer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Session</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-4"><Skeleton className="h-12" /><Skeleton className="h-12 mt-2" /><Skeleton className="h-12 mt-2" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center">
                  <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">No attendance records found</p>
                </td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-secondary/20">
                  <td className="px-4 py-3 text-sm text-foreground">{r.studentName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.trainerName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.course_sessions?.title || `Session #${r.course_sessions?.session_number}`}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "present" ? "bg-emerald-50 text-emerald-700" : r.status === "excused" ? "bg-amber-50 text-amber-700" : "bg-destructive/10 text-destructive"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.marked_at ? formatDateIST(r.marked_at) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAttendance;
