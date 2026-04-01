import { useState, useEffect, useCallback } from "react";
import { formatDateTimeIST } from "@/lib/dateUtils";
import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, Star, Brain, FileText, Award, Users, ArrowRight, Clock, Calendar, TrendingUp, Wallet, IndianRupee, CheckCircle, Sparkles, MapPin, Languages, Copy, Share2, Gift, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GettingStartedChecklist from "@/components/GettingStartedChecklist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { useAuth } from "@/hooks/useAuth";
import StudentLayout from "@/components/layouts/StudentLayout";
import StudentProgressSection from "@/components/StudentProgressSection";
import ReferralLeaderboardWidget from "@/components/ReferralLeaderboardWidget";
import RatingModal from "@/components/RatingModal";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useLoadingTitle } from "@/hooks/useLoadingTitle";
import { RefreshCw } from "lucide-react";

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    activeCourses: 0, sessionsDone: 0, totalSessions: 0,
    aiScore: null as number | null, resumeScore: null as number | null,
    enrollments: [] as any[], sessions: [] as any[], unratedSessions: [] as any[],
    certificates: 0, referralCredits: 0, walletBalance: 0,
    attendancePercent: null as number | null,
    referralCode: "" as string,
  });
  const [ratingModal, setRatingModal] = useState<any>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [recommendedTrainers, setRecommendedTrainers] = useState<any[]>([]);
  useLoadingTitle(loading);

  const fetchDashboard = useCallback(async () => {
    if (!user) return;
    const { data: student } = await supabase.from("students").select("id, referral_credits, referral_code, course_interests, trainer_gender_preference").eq("user_id", user.id).maybeSingle();
    if (!student) { setLoading(false); return; }
    setStudentId(student.id);

    // Auto-generate referral code if missing
    let referralCode = student.referral_code || "";
    if (!referralCode) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      referralCode = "SM-";
      for (let i = 0; i < 6; i++) referralCode += chars[Math.floor(Math.random() * chars.length)];
      await supabase.from("students").update({ referral_code: referralCode }).eq("id", student.id);
    }

    const [enrollRes, aiRes, resumeRes, completedSessions, certsRes, upcomingSessions, walletRes] = await Promise.all([
      supabase.from("enrollments").select("*, courses(title, total_sessions)").eq("student_id", student.id).eq("status", "active"),
      supabase.from("ai_interviews").select("overall_score").eq("student_id", student.id).order("completed_at", { ascending: false }).limit(1),
      supabase.from("student_resumes").select("ats_score").eq("student_id", student.id).limit(1),
      supabase.from("course_sessions").select("id, enrollments!inner(student_id)", { count: "exact", head: true }).eq("status", "completed").eq("enrollments.student_id", student.id),
      supabase.from("certificates").select("id", { count: "exact", head: true }).eq("student_id", student.id),
      supabase.from("course_sessions").select("*, enrollments!inner(student_id, trainer_id, courses(title))").eq("enrollments.student_id", student.id).eq("status", "upcoming").order("scheduled_at", { ascending: true }).limit(5),
      supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
    ]);

    const enrollments = enrollRes.data || [];
    let enrichedEnrollments = enrollments;
    if (enrollments.length > 0) {
      const trainerIds = enrollments.map(e => e.trainer_id);
      const { data: trainers, error: trainersErr } = await supabase.from("trainers").select("id, user_id").in("id", trainerIds);
      if (trainersErr) console.error("Failed to load trainer data for enrollments:", trainersErr);
      const userIds = (trainers || []).map(t => t.user_id);
      const profileMap = userIds.length > 0 ? await fetchProfilesMap(userIds) : {};
      const trainerNameMap: Record<string, string> = {};
      (trainers || []).forEach(t => { trainerNameMap[t.id] = profileMap[t.user_id]?.full_name || "Trainer"; });
      enrichedEnrollments = enrollments.map(e => ({ ...e, trainerName: trainerNameMap[e.trainer_id] || "Trainer" }));
    }

    // Enrich upcoming sessions with trainer names
    let enrichedSessions = upcomingSessions.data || [];
    if (enrichedSessions.length > 0) {
      const trainerIds = [...new Set(enrichedSessions.map(s => s.trainer_id))];
      const { data: trainers, error: sessionTrainersErr } = await supabase.from("trainers").select("id, user_id").in("id", trainerIds);
      if (sessionTrainersErr) console.error("Failed to load trainer data for sessions:", sessionTrainersErr);
      const userIds = (trainers || []).map(t => t.user_id);
      const profileMap = userIds.length > 0 ? await fetchProfilesMap(userIds) : {};
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
      referralCode,
    });

    // Fetch recommended trainers based on course interests
    const interests = (student.course_interests as string[]) || [];
    if (interests.length > 0) {
      const { data: allTrainers } = await supabase
        .from("trainers")
        .select("id, user_id, skills, teaching_languages, average_rating, current_role, current_company, experience_years, total_students")
        .eq("approval_status", "approved")
        .order("boost_score", { ascending: false })
        .limit(20);

      if (allTrainers && allTrainers.length > 0) {
        // Score trainers by interest overlap
        const scored = allTrainers.map(t => {
          let score = 0;
          if (t.skills?.length) {
            const overlap = interests.filter(i => t.skills!.some((s: string) => s.toLowerCase() === i.toLowerCase()));
            score += overlap.length * 4;
          }
          if (t.average_rating && t.average_rating >= 4) score += 2;
          if (t.total_students && t.total_students >= 5) score += 1;
          return { ...t, matchScore: score };
        }).filter(t => t.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);

        if (scored.length > 0) {
          const tUserIds = scored.map(t => t.user_id);
          const tProfileMap = await fetchProfilesMap(tUserIds);
          const enriched = scored.map(t => ({
            ...t,
            trainerName: tProfileMap[t.user_id]?.full_name || "Trainer",
            trainerCity: tProfileMap[t.user_id]?.city || "",
            profilePicture: tProfileMap[t.user_id]?.profile_picture_url || "",
            matchedSkills: interests.filter(i => t.skills?.some((s: string) => s.toLowerCase() === i.toLowerCase())),
          }));
          setRecommendedTrainers(enriched);
        }
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleRefresh = useCallback(async () => { await fetchDashboard(); }, [fetchDashboard]);
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
          <p className="mt-1 text-sm text-muted-foreground">Here's how your learning is going</p>
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
                <p className="text-sm text-muted-foreground mt-2">You haven't enrolled in any course yet. Browse trainers to get started!</p>
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
                <p className="text-sm text-muted-foreground mt-2">No sessions coming up. Book a session to get started!</p>
              </div>
            ) : data.sessions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 mb-2 last:mb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.title || s.enrollments?.courses?.title || `Session #${s.session_number}`}</p>
                    <p className="text-xs text-muted-foreground">{s.trainerName} • {s.scheduled_at ? formatDateTimeIST(s.scheduled_at) : "TBD"}</p>
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

      {/* Recommended Trainers */}
      {recommendedTrainers.length > 0 && (
        <div className="mt-6 bg-card rounded-xl border">
          <div className="flex items-center justify-between p-5 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Recommended For You</h2>
            </div>
            <Link to="/browse-trainers" className="text-xs font-medium text-primary hover:underline">See all</Link>
          </div>
          <div className="px-5 pb-5 grid sm:grid-cols-2 gap-3">
            {recommendedTrainers.map((t: any) => (
              <Link key={t.id} to={`/browse-trainers`} className="block">
                <div className="p-4 rounded-xl border bg-muted/20 hover:border-primary/30 hover:bg-muted/40 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {t.profilePicture ? (
                        <img src={t.profilePicture} alt={t.trainerName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-bold text-lg">{t.trainerName?.[0] || "T"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.trainerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.current_role || "Trainer"}{t.current_company ? ` at ${t.current_company}` : ""}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {t.average_rating && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{Number(t.average_rating).toFixed(1)}
                          </span>
                        )}
                        {t.experience_years && (
                          <span className="text-xs text-muted-foreground">{t.experience_years}+ yrs</span>
                        )}
                        {t.trainerCity && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />{t.trainerCity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {t.matchedSkills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.matchedSkills.slice(0, 3).map((skill: string) => (
                        <span key={skill} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                          {skill}
                        </span>
                      ))}
                      {t.matchedSkills.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] text-muted-foreground bg-secondary">+{t.matchedSkills.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Learning Progress */}
      {studentId && <StudentProgressSection studentId={studentId} />}

      {/* Referral Leaderboard */}
      {studentId && <ReferralLeaderboardWidget currentStudentId={studentId} />}

      {/* Referral Code Widget */}
      {data.referralCode && (
        <div className="mt-6 bg-card rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Your Referral Code</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm font-mono font-semibold text-foreground truncate">
                {data.referralCode}
              </div>
              <Button variant="outline" size="icon" className="shrink-0" onClick={() => {
                navigator.clipboard.writeText(data.referralCode);
                toast({ title: "Copied!", description: "Referral code copied", variant: "success" as any });
              }}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                https://skillmitra.online/student/signup?ref={data.referralCode}
              </div>
              <Button variant="outline" size="icon" className="shrink-0" onClick={() => {
                navigator.clipboard.writeText(`https://skillmitra.online/student/signup?ref=${data.referralCode}`);
                toast({ title: "Copied!", description: "Referral link copied", variant: "success" as any });
              }}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Link to="/student/referrals">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full">
                <Share2 className="w-3.5 h-3.5" /> View Referral Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}

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
