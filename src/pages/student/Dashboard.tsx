import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { useAuth } from "@/hooks/useAuth";
import StudentLayout from "@/components/layouts/StudentLayout";
import RatingModal from "@/components/RatingModal";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ activeCourses: 0, sessionsDone: 0, aiScore: null as number | null, resumeScore: null as number | null, enrollments: [] as any[], sessions: [] as any[], unratedSessions: [] as any[] });
  const [ratingModal, setRatingModal] = useState<any>(null);

  const fetchDashboard = async () => {
    if (!user) return;
    const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
    if (!student) { setLoading(false); return; }

    const [enrollRes, sessRes, aiRes, resumeRes, completedSessions] = await Promise.all([
      supabase.from("enrollments").select("*, courses(title)").eq("student_id", student.id).eq("status", "active"),
      supabase.from("course_sessions").select("*").eq("status", "upcoming").order("scheduled_at", { ascending: true }).limit(5),
      supabase.from("ai_interviews").select("overall_score").eq("student_id", student.id).order("completed_at", { ascending: false }).limit(1),
      supabase.from("student_resumes").select("ats_score").eq("student_id", student.id).limit(1),
      supabase.from("course_sessions").select("id", { count: "exact", head: true }).eq("status", "completed"),
    ]);

    // Enrich enrollments with trainer names
    const enrollments = enrollRes.data || [];
    let enrichedEnrollments = enrollments;
    if (enrollments.length > 0) {
      const trainerIds = enrollments.map(e => e.trainer_id);
      const { data: trainers } = await supabase.from("trainers").select("id, user_id").in("id", trainerIds);
      const userIds = (trainers || []).map(t => t.user_id);
      const profileMap = await fetchProfilesMap(userIds);
      const trainerNameMap: Record<string, string> = {};
      (trainers || []).forEach(t => { trainerNameMap[t.id] = profileMap[t.user_id]?.full_name || "Trainer"; });
      enrichedEnrollments = enrollments.map(e => ({ ...e, trainerName: trainerNameMap[e.trainer_id] || "Trainer" }));
    }

    // Find completed sessions that haven't been rated by this student
    const { data: completedSessionsList } = await supabase.from("course_sessions").select("*, enrollments!inner(student_id, trainer_id)").eq("status", "completed").eq("enrollments.student_id", student.id);
    const { data: existingRatings } = await supabase.from("ratings").select("session_id").eq("student_id", student.id).not("student_rated_at", "is", null);
    const ratedSessionIds = new Set((existingRatings || []).map(r => r.session_id));
    const unrated = (completedSessionsList || []).filter(s => !ratedSessionIds.has(s.id));

    setData({
      activeCourses: enrollments.length,
      sessionsDone: completedSessions.count || 0,
      aiScore: aiRes.data?.[0]?.overall_score ?? null,
      resumeScore: resumeRes.data?.[0]?.ats_score ?? null,
      enrollments: enrichedEnrollments,
      sessions: sessRes.data || [],
      unratedSessions: unrated,
    });
    setLoading(false);
  };

  useEffect(() => { fetchDashboard(); }, [user]);

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold text-foreground">Welcome back! 👋</h1>
      <p className="mt-1 text-muted-foreground">Here's your learning progress overview</p>

      {/* Rating Prompts */}
      {data.unratedSessions.length > 0 && (
        <div className="mt-4 bg-accent/10 border border-accent/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-foreground">Rate Your Sessions</h3>
          </div>
          {data.unratedSessions.slice(0, 3).map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-card rounded-lg mb-2 last:mb-0">
              <p className="text-sm text-foreground">{s.title || `Session #${s.session_number}`}</p>
              <Button size="sm" onClick={() => setRatingModal({
                sessionId: s.id, enrollmentId: s.enrollment_id,
                studentId: s.enrollments?.student_id, trainerId: s.trainer_id,
              })}>Rate Now</Button>
            </div>
          ))}
        </div>
      )}

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
                <p className="text-sm text-muted-foreground">Trainer: {e.trainerName}</p>
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

      {ratingModal && (
        <RatingModal
          type="student_rates_trainer"
          sessionId={ratingModal.sessionId}
          enrollmentId={ratingModal.enrollmentId}
          studentId={ratingModal.studentId}
          trainerId={ratingModal.trainerId}
          targetName="your trainer"
          onClose={() => setRatingModal(null)}
          onSubmitted={() => { setRatingModal(null); fetchDashboard(); }}
        />
      )}
    </StudentLayout>
  );
};

export default StudentDashboard;
