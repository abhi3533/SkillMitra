import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StudentLayout from "@/components/layouts/StudentLayout";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ activeCourses: 0, sessionsDone: 0, aiScore: null as number | null, resumeScore: null as number | null, enrollments: [] as any[], sessions: [] as any[] });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (!student) { setLoading(false); return; }

      const [enrollRes, sessRes, aiRes, resumeRes] = await Promise.all([
        supabase.from("enrollments").select("*, courses(title), trainers(*, profiles(full_name))").eq("student_id", student.id).eq("status", "active"),
        supabase.from("course_sessions").select("*").eq("status", "upcoming").order("scheduled_at", { ascending: true }).limit(5),
        supabase.from("ai_interviews").select("overall_score").eq("student_id", student.id).order("completed_at", { ascending: false }).limit(1),
        supabase.from("student_resumes").select("ats_score").eq("student_id", student.id).limit(1),
      ]);

      const completedSessions = await supabase.from("course_sessions").select("id", { count: "exact", head: true }).eq("status", "completed");

      setData({
        activeCourses: (enrollRes.data || []).length,
        sessionsDone: completedSessions.count || 0,
        aiScore: aiRes.data?.[0]?.overall_score ?? null,
        resumeScore: resumeRes.data?.[0]?.ats_score ?? null,
        enrollments: enrollRes.data || [],
        sessions: sessRes.data || [],
      });
      setLoading(false);
    })();
  }, [user]);

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold text-foreground">Welcome back! 👋</h1>
      <p className="mt-1 text-muted-foreground">Here's your learning progress overview</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Active Courses", value: loading ? "-" : String(data.activeCourses) },
          { label: "Sessions Done", value: loading ? "-" : String(data.sessionsDone) },
          { label: "AI Interview Score", value: loading ? "-" : data.aiScore !== null ? `${data.aiScore}%` : "Not taken yet" },
          { label: "Resume Score", value: loading ? "-" : data.resumeScore !== null ? `${data.resumeScore}%` : "Not built yet" },
        ].map(card => (
          <div key={card.label} className="bg-card rounded-xl border p-5">
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Current Course Progress */}
      <div className="mt-8 bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Current Course Progress</h2>
        {loading ? <div className="h-16 skeleton rounded-lg" /> :
          data.enrollments.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground mt-2">You haven't enrolled in any courses yet</p>
              <Link to="/browse"><Button className="mt-3">Browse Trainers</Button></Link>
            </div>
          ) : data.enrollments.map((e: any) => (
            <div key={e.id} className="flex items-center gap-4 mb-4 last:mb-0">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{e.courses?.title}</h3>
                <p className="text-sm text-muted-foreground">Trainer: {e.trainers?.profiles?.full_name}</p>
                <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${e.progress_percent || 0}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{e.progress_percent || 0}% complete • {e.sessions_completed || 0}/{e.sessions_total || 0} sessions</p>
              </div>
            </div>
          ))
        }
      </div>

      {/* Upcoming Sessions */}
      <div className="mt-6 bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Sessions</h2>
        {loading ? <div className="h-16 skeleton rounded-lg" /> :
          data.sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No upcoming sessions scheduled</p>
          ) : data.sessions.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 mb-2 last:mb-0">
              <div>
                <p className="text-sm font-medium text-foreground">{s.title || `Session #${s.session_number}`}</p>
                <p className="text-xs text-muted-foreground">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString("en-IN") : "TBD"}</p>
              </div>
            </div>
          ))
        }
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
