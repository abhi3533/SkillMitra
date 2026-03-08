import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, Star, Brain, FileText, Award, Users, ArrowRight, Clock, Calendar, TrendingUp, Wallet, IndianRupee, CheckCircle } from "lucide-react";
import GettingStartedChecklist from "@/components/GettingStartedChecklist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { useAuth } from "@/hooks/useAuth";
import StudentLayout from "@/components/layouts/StudentLayout";
import StudentProgressSection from "@/components/StudentProgressSection";
import RatingModal from "@/components/RatingModal";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useLoadingTitle } from "@/hooks/useLoadingTitle";
import { RefreshCw } from "lucide-react";

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    activeCourses: 0, sessionsDone: 0, totalSessions: 0,
    aiScore: null as number | null, resumeScore: null as number | null,
    enrollments: [] as any[], sessions: [] as any[], unratedSessions: [] as any[],
    certificates: 0, referralCredits: 0, walletBalance: 0,
    attendancePercent: null as number | null,
  });
  const [ratingModal, setRatingModal] = useState<any>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  useLoadingTitle(loading);

  const fetchDashboard = async () => {
    if (!user) return;
    const { data: student } = await supabase.from("students").select("id, referral_credits").eq("user_id", user.id).single();
    if (!student) { setLoading(false); return; }

    const [enrollRes, aiRes, resumeRes, completedSessions, certsRes, upcomingSessions, walletRes] = await Promise.all([
      supabase.from("enrollments").select("*, courses(title, total_sessions)").eq("student_id", student.id).eq("status", "active"),
      supabase.from("ai_interviews").select("overall_score").eq("student_id", student.id).order("completed_at", { ascending: false }).limit(1),
      supabase.from("student_resumes").select("ats_score").eq("student_id", student.id).limit(1),
      supabase.from("course_sessions").select("id", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("certificates").select("id", { count: "exact", head: true }).eq("student_id", student.id),
      supabase.from("course_sessions").select("*, enrollments!inner(student_id, trainer_id, courses(title))").eq("enrollments.student_id", student.id).eq("status", "upcoming").order("scheduled_at", { ascending: true }).limit(5),
      supabase.from("wallets").select("balance").eq("user_id", user.id).single(),
    ]);

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

    // Enrich upcoming sessions with trainer names
    let enrichedSessions = upcomingSessions.data || [];
    if (enrichedSessions.length > 0) {
      const trainerIds = [...new Set(enrichedSessions.map(s => s.trainer_id))];
      const { data: trainers } = await supabase.from("trainers").select("id, user_id").in("id", trainerIds);
      const userIds = (trainers || []).map(t => t.user_id);
      const profileMap = await fetchProfilesMap(userIds);
      const trainerNameMap: Record<string, string> = {};
      (trainers || []).forEach(t => { trainerNameMap[t.id] = profileMap[t.user_id]?.full_name || "Trainer"; });
      enrichedSessions = enrichedSessions.map(s => ({ ...s, trainerName: trainerNameMap[s.trainer_id] || "Trainer" }));
    }

    // Find unrated sessions
    const { data: completedSessionsList } = await supabase.from("course_sessions").select("*, enrollments!inner(student_id, trainer_id)").eq("status", "completed").eq("enrollments.student_id", student.id);
    const { data: existingRatings } = await supabase.from("ratings").select("session_id").eq("student_id", student.id).not("student_rated_at", "is", null);
    const ratedSessionIds = new Set((existingRatings || []).map(r => r.session_id));
    const unrated = (completedSessionsList || []).filter(s => !ratedSessionIds.has(s.id));

    // Fetch attendance
    const { data: attendanceData } = await supabase.from("attendance").select("status").eq("student_id", student.id);
    const totalAttendance = (attendanceData || []).length;
    const presentCount = (attendanceData || []).filter(a => a.status === "present").length;
    const attendancePercent = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null;

    setData({
      activeCourses: enrollments.length,
      sessionsDone: completedSessions.count || 0,
      totalSessions: enrollments.reduce((s, e) => s + (e.sessions_total || e.courses?.total_sessions || 0), 0),
      aiScore: aiRes.data?.[0]?.overall_score ?? null,
      resumeScore: resumeRes.data?.[0]?.ats_score ?? null,
      enrollments: enrichedEnrollments,
      sessions: enrichedSessions,
      unratedSessions: unrated,
      certificates: certsRes.count || 0,
      referralCredits: Number(student.referral_credits) || 0,
      walletBalance: Number(walletRes.data?.balance) || 0,
      attendancePercent,
    });
    setLoading(false);
  };

  useEffect(() => { fetchDashboard(); }, [user]);

  const handleRefresh = useCallback(async () => { await fetchDashboard(); }, [user]);
  const { pulling, refreshing } = usePullToRefresh(handleRefresh);

  const firstName = profile?.full_name?.split(" ")[0] || "Student";

  return (
    <StudentLayout>
      {(pulling || refreshing) && (
        <div className="pull-refresh-indicator">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Pull to refresh"}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back, {firstName}! 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's your training progress overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/student/wallet" className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/15 transition-colors px-3 py-2 rounded-lg">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary flex items-center"><IndianRupee className="w-3.5 h-3.5" />{Number(data.walletBalance || 0).toLocaleString("en-IN")}</span>
          </Link>
          <Link to="/browse">
            <Button size="sm" className="gap-1.5 text-xs hidden sm:flex">
              <BookOpen className="w-3.5 h-3.5" /> Browse Trainers
            </Button>
          </Link>
        </div>
      </div>

      {/* Getting Started Checklist */}
      <div className="mt-6">
        <GettingStartedChecklist />
      </div>

      {/* Rating Prompts */}
      {data.unratedSessions.length > 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-foreground">Rate Your Sessions ({data.unratedSessions.length})</h3>
          </div>
          {data.unratedSessions.slice(0, 3).map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-card rounded-lg mb-2 last:mb-0">
              <p className="text-sm text-foreground">{s.title || `Session #${s.session_number}`}</p>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setRatingModal({
                sessionId: s.id, enrollmentId: s.enrollment_id,
                studentId: s.enrollments?.student_id, trainerId: s.trainer_id,
              })}>Rate Now</Button>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {(() => {
          const attendanceColor = data.attendancePercent === null ? "text-muted-foreground" 
            : data.attendancePercent >= 90 ? "text-emerald-600" 
            : data.attendancePercent >= 75 ? "text-amber-600" 
            : "text-destructive";
          const attendanceBg = data.attendancePercent === null ? "bg-muted" 
            : data.attendancePercent >= 90 ? "bg-emerald-50" 
            : data.attendancePercent >= 75 ? "bg-amber-50" 
            : "bg-destructive/10";
          return [
            { label: "Active Courses", value: loading ? "–" : String(data.activeCourses), icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
            { label: "Attendance", value: loading ? "–" : data.attendancePercent !== null ? `${data.attendancePercent}%` : "—", icon: CheckCircle, color: attendanceColor, bg: attendanceBg },
            { label: "Sessions Done", value: loading ? "–" : `${data.sessionsDone}${data.totalSessions ? `/${data.totalSessions}` : ""}`, icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
            { label: "AI Interview", value: loading ? "–" : data.aiScore !== null ? `${data.aiScore}%` : "—", icon: Brain, color: "text-emerald-600", bg: "bg-emerald-50", link: "/student/interview" },
            { label: "Resume Score", value: loading ? "–" : data.resumeScore !== null ? `${data.resumeScore}%` : "—", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50", link: "/student/resume" },
            { label: "Certificates", value: loading ? "–" : String(data.certificates), icon: Award, color: "text-amber-600", bg: "bg-amber-50", link: "/student/certificates" },
            { label: "Referral Credits", value: loading ? "–" : `₹${data.referralCredits}`, icon: Users, color: "text-primary", bg: "bg-primary/10", link: "/student/referrals" },
          ];
        })().map(card => {
          const content = (
            <div className="bg-card rounded-xl border p-4 hover:border-primary/20 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                {'link' in card && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
              </div>
              <p className="text-xl font-bold text-foreground">{card.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          );
          return 'link' in card ? <Link key={card.label} to={card.link!}>{content}</Link> : <div key={card.label}>{content}</div>;
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        {/* Current Course Progress */}
        <div className="bg-card rounded-xl border">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold text-foreground">Course Progress</h2>
            <Link to="/student/courses" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : data.enrollments.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No active courses yet</p>
                <Link to="/browse"><Button size="sm" className="mt-3 text-xs">Browse Trainers</Button></Link>
              </div>
            ) : data.enrollments.map((e: any) => (
              <div key={e.id} className="p-3 rounded-lg bg-muted/30 mb-2 last:mb-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{e.courses?.title}</h3>
                    <p className="text-xs text-muted-foreground">with {e.trainerName}</p>
                    <div className="mt-2">
                      <Progress value={e.progress_percent || 0} className="h-1.5" />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-muted-foreground">{e.progress_percent || 0}% complete</p>
                      <p className="text-[11px] text-muted-foreground">{e.sessions_completed || 0}/{e.sessions_total || e.courses?.total_sessions || 0} sessions</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-card rounded-xl border">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold text-foreground">Upcoming Sessions</h2>
          </div>
          <div className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : data.sessions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No upcoming sessions</p>
              </div>
            ) : data.sessions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 mb-2 last:mb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.title || s.enrollments?.courses?.title || `Session #${s.session_number}`}</p>
                    <p className="text-xs text-muted-foreground">{s.trainerName} • {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "TBD"}</p>
                  </div>
                </div>
                {s.meet_link && (
                  <a href={s.meet_link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="text-xs h-7">Join</Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-card rounded-xl border p-5">
        <h2 className="text-base font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Browse Trainers", path: "/browse", icon: Users },
            { label: "AI Interview Prep", path: "/student/interview", icon: Brain },
            { label: "Build Resume", path: "/student/resume", icon: FileText },
            { label: "My Certificates", path: "/student/certificates", icon: Award },
            { label: "Refer & Earn", path: "/student/referrals", icon: TrendingUp },
          ].map(a => (
            <Link key={a.label} to={a.path}>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                <a.icon className="w-3.5 h-3.5" />{a.label}
              </Button>
            </Link>
          ))}
        </div>
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
