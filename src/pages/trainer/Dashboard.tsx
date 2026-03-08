import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Users, IndianRupee, Calendar, Star, BookOpen, Clock, AlertTriangle, TrendingUp, ArrowRight, Wallet, CreditCard, Bell, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { useAuth } from "@/hooks/useAuth";
import TrainerLayout from "@/components/layouts/TrainerLayout";

const TrainerDashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    activeStudents: 0, totalStudents: 0, monthEarnings: 0, totalEarnings: 0,
    availableBalance: 0, totalSessions: 0, completedSessions: 0, upcomingSessions: 0,
    avgRating: 0, totalCourses: 0, approvalStatus: "pending",
    todaySessions: [] as any[], reviews: [] as any[], recentEnrollments: [] as any[],
    unreadNotifs: 0, pendingAttendance: 0, walletBalance: 0, todayCount: 0,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: trainer } = await supabase.from("trainers").select("id, average_rating, total_students, total_earnings, available_balance, approval_status").eq("user_id", user.id).single();
      if (!trainer) { setLoading(false); return; }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const [enrollActive, enrollAll, sessAll, sessCompleted, sessUpcoming, earningsRes, todayRes, reviewsRes, coursesRes, notifRes, walletRes] = await Promise.all([
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("trainer_id", trainer.id).eq("status", "active"),
        supabase.from("enrollments").select("*, courses(title), students(id, user_id)").eq("trainer_id", trainer.id).order("enrollment_date", { ascending: false }).limit(5),
        supabase.from("course_sessions").select("id", { count: "exact", head: true }).eq("trainer_id", trainer.id),
        supabase.from("course_sessions").select("id", { count: "exact", head: true }).eq("trainer_id", trainer.id).eq("status", "completed"),
        supabase.from("course_sessions").select("id", { count: "exact", head: true }).eq("trainer_id", trainer.id).eq("status", "upcoming"),
        supabase.from("enrollments").select("trainer_payout").eq("trainer_id", trainer.id).gte("enrollment_date", startOfMonth),
        supabase.from("course_sessions").select("*, enrollments!inner(student_id, courses(title))").eq("trainer_id", trainer.id).gte("scheduled_at", todayStart).lt("scheduled_at", todayEnd).order("scheduled_at", { ascending: true }),
        supabase.from("ratings").select("*").eq("trainer_id", trainer.id).not("student_to_trainer_rating", "is", null).order("created_at", { ascending: false }).limit(5),
        supabase.from("courses").select("id", { count: "exact", head: true }).eq("trainer_id", trainer.id),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
        supabase.from("wallets").select("balance").eq("user_id", user.id).single(),
      ]);

      const monthTotal = (earningsRes.data || []).reduce((s: number, e: any) => s + Number(e.trainer_payout || 0), 0);

      // Enrich reviews
      let enrichedReviews: any[] = [];
      if (reviewsRes.data && reviewsRes.data.length > 0) {
        const studentIds = reviewsRes.data.map(r => r.student_id);
        const { data: students } = await supabase.from("students").select("id, user_id").in("id", studentIds);
        const userIds = (students || []).map(s => s.user_id);
        const profileMap = await fetchProfilesMap(userIds);
        const nameMap: Record<string, string> = {};
        (students || []).forEach(s => { nameMap[s.id] = profileMap[s.user_id]?.full_name || "Student"; });
        enrichedReviews = reviewsRes.data.map(r => ({ ...r, studentName: nameMap[r.student_id] || "Student" }));
      }

      // Enrich today's sessions with student names
      let enrichedToday = todayRes.data || [];
      if (enrichedToday.length > 0) {
        const studentIds = [...new Set(enrichedToday.map(s => s.enrollments?.student_id).filter(Boolean))];
        if (studentIds.length > 0) {
          const { data: students } = await supabase.from("students").select("id, user_id").in("id", studentIds);
          const userIds = (students || []).map(s => s.user_id);
          const profileMap = await fetchProfilesMap(userIds);
          const nameMap: Record<string, string> = {};
          (students || []).forEach(s => { nameMap[s.id] = profileMap[s.user_id]?.full_name || "Student"; });
          enrichedToday = enrichedToday.map(s => ({ ...s, studentName: nameMap[s.enrollments?.student_id] || "Student" }));
        }
      }

      // Enrich recent enrollments
      let enrichedEnrollments: any[] = [];
      if (enrollAll.data && enrollAll.data.length > 0) {
        const studentUserIds = enrollAll.data.map(e => e.students?.user_id).filter(Boolean);
        const profileMap = await fetchProfilesMap(studentUserIds as string[]);
        enrichedEnrollments = enrollAll.data.map(e => ({
          ...e,
          studentName: e.students?.user_id ? (profileMap[e.students.user_id]?.full_name || "Student") : "Student",
        }));
      }

      setData({
        activeStudents: enrollActive.count || 0,
        totalStudents: trainer.total_students || 0,
        monthEarnings: monthTotal,
        totalEarnings: Number(trainer.total_earnings) || 0,
        availableBalance: Number(trainer.available_balance) || 0,
        totalSessions: sessAll.count || 0,
        completedSessions: sessCompleted.count || 0,
        upcomingSessions: sessUpcoming.count || 0,
        avgRating: Number(trainer.average_rating) || 0,
        totalCourses: coursesRes.count || 0,
        approvalStatus: trainer.approval_status || "pending",
        todaySessions: enrichedToday,
        reviews: enrichedReviews,
        recentEnrollments: enrichedEnrollments,
        unreadNotifs: notifRes.count || 0,
        walletBalance: Number(walletRes.data?.balance || 0),
        todayCount: enrichedToday.length,
        pendingAttendance: enrichedToday.filter((s: any) => s.status !== "completed").length,
      });
      setLoading(false);
    })();
  }, [user]);

  const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const firstName = profile?.full_name?.split(" ")[0] || "Trainer";

  return (
    <TrainerLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {firstName}! 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your students, courses, and earnings</p>
        </div>
        <Link to="/trainer/courses">
          <Button size="sm" className="gap-1.5 text-xs hidden sm:flex">
            <BookOpen className="w-3.5 h-3.5" /> My Courses
          </Button>
        </Link>
      </div>

      {/* Approval Status Banner */}
      {data.approvalStatus === "pending" && !loading && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Application Under Review</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Your trainer profile is being reviewed by the admin team. You'll be notified once approved.</p>
          </div>
        </div>
      )}
      {data.approvalStatus === "rejected" && !loading && (
        <div className="mt-4 bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Application Not Approved</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Please update your profile and documents, then contact support to re-apply.</p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          {[
            { label: "Today Sessions", value: String(data.todayCount), icon: Calendar, color: "text-primary", bg: "bg-primary/10", link: "/trainer/sessions" },
            { label: "Pending Attendance", value: String(data.pendingAttendance), icon: ClipboardCheck, color: "text-amber-600", bg: "bg-amber-50", link: "/trainer/attendance" },
            { label: "Wallet Balance", value: formatINR(data.walletBalance), icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50", link: "/trainer/wallet" },
            { label: "Unread Notifs", value: String(data.unreadNotifs), icon: Bell, color: "text-primary", bg: "bg-primary/10", link: "/notifications" },
            { label: "Avg. Rating", value: data.avgRating > 0 ? `${data.avgRating.toFixed(1)} ★` : "—", icon: Star, color: "text-amber-600", bg: "bg-amber-50", link: "/trainer/reviews" },
          ].map(card => (
            <Link key={card.label} to={card.link}>
              <div className="bg-card rounded-xl border p-4 hover:border-primary/20 transition-colors text-center">
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mx-auto mb-2`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-lg font-bold text-foreground">{card.value}</p>
                <p className="text-[11px] text-muted-foreground">{card.label}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {[
          { label: "Active Students", value: loading ? "–" : String(data.activeStudents), icon: Users, color: "text-primary", bg: "bg-primary/10", link: "/trainer/students" },
          { label: "This Month", value: loading ? "–" : formatINR(data.monthEarnings), icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50", link: "/trainer/earnings" },
          { label: "Available Balance", value: loading ? "–" : formatINR(data.availableBalance), icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50", link: "/trainer/earnings" },
          { label: "Upcoming Sessions", value: loading ? "–" : String(data.upcomingSessions), icon: Clock, color: "text-primary", bg: "bg-primary/10", link: "/trainer/schedule" },
          { label: "Completed Sessions", value: loading ? "–" : String(data.completedSessions), icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
          { label: "Total Earnings", value: loading ? "–" : formatINR(data.totalEarnings), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", link: "/trainer/earnings" },
        ].map(card => {
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
        {/* Today's Sessions */}
        <div className="bg-card rounded-xl border">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold text-foreground">Today's Sessions</h2>
            <Link to="/trainer/schedule" className="text-xs font-medium text-primary hover:underline">Full schedule</Link>
          </div>
          <div className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : data.todaySessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No sessions today. Enjoy your day! ☀️</p>
              </div>
            ) : data.todaySessions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 mb-2 last:mb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.title || s.enrollments?.courses?.title || `Session #${s.session_number}`}</p>
                    <p className="text-xs text-muted-foreground">{s.studentName} • {s.scheduled_at ? new Date(s.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                  </div>
                </div>
                {s.meet_link && (
                  <a href={s.meet_link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="text-xs h-7">Start</Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="bg-card rounded-xl border">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold text-foreground">Recent Enrollments</h2>
            <Link to="/trainer/students" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : data.recentEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No enrollments yet</p>
              </div>
            ) : data.recentEnrollments.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 mb-2 last:mb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{e.studentName}</p>
                  <p className="text-xs text-muted-foreground">{e.courses?.title} • {new Date(e.enrollment_date).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Badge variant={e.status === "active" ? "default" : "secondary"} className="text-[11px]">{e.status}</Badge>
                  <span className="text-sm font-semibold text-foreground">{formatINR(Number(e.amount_paid || 0))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-card rounded-xl border lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold text-foreground">Recent Student Reviews</h2>
          </div>
          <div className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : data.reviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No reviews yet. Complete sessions to receive student feedback.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {data.reviews.map((r: any) => (
                  <div key={r.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{r.studentName}</span>
                      <span className="text-amber-500 text-xs">{"★".repeat(r.student_to_trainer_rating || 0)}{"☆".repeat(5 - (r.student_to_trainer_rating || 0))}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.student_review_text || r.student_to_trainer_review || "No comment"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-card rounded-xl border p-5">
        <h2 className="text-base font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Create Course", path: "/trainer/courses", icon: BookOpen },
            { label: "My Students", path: "/trainer/students", icon: Users },
            { label: "Set Schedule", path: "/trainer/schedule", icon: Calendar },
            { label: "View Earnings", path: "/trainer/earnings", icon: IndianRupee },
            { label: "Issue Certificate", path: "/trainer/certificates", icon: CreditCard },
            { label: "Edit Profile", path: "/trainer/profile", icon: TrendingUp },
          ].map(a => (
            <Link key={a.label} to={a.path}>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                <a.icon className="w-3.5 h-3.5" />{a.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </TrainerLayout>
  );
};

export default TrainerDashboard;
