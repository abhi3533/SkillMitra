import { useState, useEffect } from "react";
import { formatShortDateIST } from "@/lib/dateUtils";
import { CheckCircle, XCircle, AlertCircle, AlertTriangle, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StudentLayout from "@/components/layouts/StudentLayout";

const StudentAttendance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, excused: 0, percent: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
      if (!student) { setLoading(false); return; }

      const { data } = await supabase.from("attendance").select("*, course_sessions(title, session_number, scheduled_at, enrollments(courses(title)))").eq("student_id", student.id).order("marked_at", { ascending: false });
      const att = data || [];
      setRecords(att);

      const total = att.length;
      const present = att.filter(a => a.status === "present").length;
      const absent = att.filter(a => a.status === "absent").length;
      const excused = att.filter(a => a.status === "excused").length;
      setStats({ total, present, absent, excused, percent: total > 0 ? Math.round((present / total) * 100) : 0 });
      setLoading(false);
    })();
  }, [user]);

  const percentColor = stats.percent >= 90 ? "text-emerald-600" : stats.percent >= 75 ? "text-amber-600" : "text-destructive";
  const percentBg = stats.percent >= 90 ? "bg-emerald-50" : stats.percent >= 75 ? "bg-amber-50" : "bg-destructive/10";
  const progressColor = stats.percent >= 90 ? "[&>div]:bg-emerald-500" : stats.percent >= 75 ? "[&>div]:bg-amber-500" : "[&>div]:bg-destructive";

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
      <p className="mt-1 text-sm text-muted-foreground">Track your session attendance and eligibility</p>

      {loading ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Overall Attendance Card */}
          <div className={`mt-6 ${percentBg} rounded-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Overall Attendance</p>
                <p className={`text-4xl font-bold mt-1 ${percentColor}`}>{stats.percent}%</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs text-muted-foreground">Present: <span className="font-semibold text-emerald-600">{stats.present}</span></p>
                <p className="text-xs text-muted-foreground">Absent: <span className="font-semibold text-destructive">{stats.absent}</span></p>
                <p className="text-xs text-muted-foreground">Excused: <span className="font-semibold text-amber-600">{stats.excused}</span></p>
              </div>
            </div>
            <Progress value={stats.percent} className={`mt-4 h-2 ${progressColor}`} />
          </div>

          {/* Warning Banner */}
          {stats.total > 0 && stats.percent < 75 && (
            <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Low Attendance Warning</p>
                <p className="text-xs text-destructive/80">Your attendance is below 75%. Maintain at least 90% to remain eligible for certificates.</p>
              </div>
            </div>
          )}

          {/* Certificate Eligibility */}
          <div className="mt-4 p-4 bg-card border rounded-xl flex items-center gap-3">
            <Award className={`w-5 h-5 ${stats.percent >= 90 ? "text-emerald-600" : "text-muted-foreground"}`} />
            <div>
              <p className="text-sm font-medium text-foreground">Certificate Eligibility</p>
              <p className="text-xs text-muted-foreground">
                {stats.percent >= 90 ? "✅ You are eligible for course certificates" : `❌ Need ${90 - stats.percent}% more attendance for certificate eligibility`}
              </p>
            </div>
          </div>

          {/* Session Records */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Session Records</h2>
            {records.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border">
                <CheckCircle className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No attendance records yet</p>
                <p className="text-xs text-muted-foreground mt-1">Records will appear once your trainer marks attendance</p>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map(r => (
                  <div key={r.id} className="bg-card border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        r.status === "present" ? "bg-emerald-50 text-emerald-600" :
                        r.status === "excused" ? "bg-amber-50 text-amber-600" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {r.status === "present" ? <CheckCircle className="w-4 h-4" /> :
                         r.status === "excused" ? <AlertCircle className="w-4 h-4" /> :
                         <XCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {r.course_sessions?.title || `Session #${r.course_sessions?.session_number}`}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {r.course_sessions?.enrollments?.courses?.title || "Course"} •{" "}
                          {r.course_sessions?.scheduled_at ? formatShortDateIST(r.course_sessions.scheduled_at) : ""}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      r.status === "present" ? "bg-emerald-50 text-emerald-700" :
                      r.status === "excused" ? "bg-amber-50 text-amber-700" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </StudentLayout>
  );
};

export default StudentAttendance;
