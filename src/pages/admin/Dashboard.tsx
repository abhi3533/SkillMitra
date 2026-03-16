import { useState, useEffect } from "react";
import { formatDateIST, formatLongDateIST } from "@/lib/dateUtils";
import { Link } from "react-router-dom";
import { Users, IndianRupee, BookOpen, Award, Clock, AlertTriangle, TrendingUp, UserCheck, UserX, MessageSquare, CreditCard, ArrowUpRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useLoadingTitle } from "@/hooks/useLoadingTitle";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    trainers: 0, pendingTrainers: 0, approvedTrainers: 0,
    students: 0, revenue: 0, activeSessions: 0,
    certificates: 0, openDisputes: 0, pendingPayouts: 0,
    totalCourses: 0, activeEnrollments: 0, contactUnread: 0,
    totalReferrals: 0,
  });
  useLoadingTitle(loading);
  const [recentTrainers, setRecentTrainers] = useState<any[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
  const [recentDisputes, setRecentDisputes] = useState<any[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [
          trainersAll, trainersPending, trainersApproved,
          studentsAll, revenueData, sessionsToday,
          certsAll, disputesOpen, payoutsPending,
          coursesAll, enrollmentsActive, contactUnread,
          referralsAll,
        ] = await Promise.all([
          supabase.from("trainers").select("id", { count: "exact", head: true }),
          supabase.from("trainers").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
          supabase.from("trainers").select("id", { count: "exact", head: true }).eq("approval_status", "approved"),
          supabase.from("students").select("id", { count: "exact", head: true }),
          supabase.from("payments").select("amount").eq("status", "paid"),
          supabase.from("course_sessions").select("id", { count: "exact", head: true }).eq("status", "upcoming"),
          supabase.from("certificates").select("id", { count: "exact", head: true }),
          supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
          supabase.from("payout_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("courses").select("id", { count: "exact", head: true }),
          supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "unread"),
          supabase.from("referrals").select("id", { count: "exact", head: true }),
        ]);

        const totalRevenue = (revenueData.data || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

        setStats({
          trainers: trainersAll.count || 0,
          pendingTrainers: trainersPending.count || 0,
          approvedTrainers: trainersApproved.count || 0,
          students: studentsAll.count || 0,
          revenue: totalRevenue,
          activeSessions: sessionsToday.count || 0,
          certificates: certsAll.count || 0,
          openDisputes: disputesOpen.count || 0,
          pendingPayouts: payoutsPending.count || 0,
          totalCourses: coursesAll.count || 0,
          activeEnrollments: enrollmentsActive.count || 0,
          contactUnread: contactUnread.count || 0,
          totalReferrals: referralsAll.count || 0,
        });

        // Fetch recent data in parallel
        const [pendingRes, enrollRes, disputeRes, payoutRes] = await Promise.all([
          supabase.from("trainers").select("*").eq("approval_status", "pending").order("created_at", { ascending: false }).limit(5),
          supabase.from("enrollments").select("*, courses(title)").order("enrollment_date", { ascending: false }).limit(5),
          supabase.from("disputes").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(3),
          supabase.from("payout_requests").select("*").eq("status", "pending").order("requested_at", { ascending: false }).limit(3),
        ]);

        // Enrich pending trainers
        if (pendingRes.data && pendingRes.data.length > 0) {
          const profileMap = await fetchProfilesMap(pendingRes.data.map(t => t.user_id));
          setRecentTrainers(pendingRes.data.map(t => ({ ...t, profileName: profileMap[t.user_id]?.full_name || "Unknown" })));
        }

        // Enrich enrollments
        if (enrollRes.data && enrollRes.data.length > 0) {
          const studentIds = enrollRes.data.map(e => e.student_id);
          const trainerIds = enrollRes.data.map(e => e.trainer_id);
          const [{ data: students }, { data: trainersData }] = await Promise.all([
            supabase.from("students").select("id, user_id").in("id", studentIds),
            supabase.from("trainers").select("id, user_id").in("id", trainerIds),
          ]);
          const allUserIds = [...(students || []).map(s => s.user_id), ...(trainersData || []).map(t => t.user_id)];
          const profileMap = await fetchProfilesMap(allUserIds);
          const studentNameMap: Record<string, string> = {};
          (students || []).forEach(s => { studentNameMap[s.id] = profileMap[s.user_id]?.full_name || "Student"; });
          const trainerNameMap: Record<string, string> = {};
          (trainersData || []).forEach(t => { trainerNameMap[t.id] = profileMap[t.user_id]?.full_name || "Trainer"; });
          setRecentEnrollments(enrollRes.data.map(e => ({
            ...e,
            studentName: studentNameMap[e.student_id] || "Student",
            trainerName: trainerNameMap[e.trainer_id] || "Trainer",
          })));
        }

        // Enrich disputes
        if (disputeRes.data && disputeRes.data.length > 0) {
          setRecentDisputes(disputeRes.data);
        }

        // Enrich payouts
        if (payoutRes.data && payoutRes.data.length > 0) {
          const trainerIds = payoutRes.data.map(p => p.trainer_id);
          const { data: trainersData } = await supabase.from("trainers").select("id, user_id").in("id", trainerIds);
          const userIds = (trainersData || []).map(t => t.user_id);
          const profileMap = await fetchProfilesMap(userIds);
          const nameMap: Record<string, string> = {};
          (trainersData || []).forEach(t => { nameMap[t.id] = profileMap[t.user_id]?.full_name || "Trainer"; });
          setRecentPayouts(payoutRes.data.map(p => ({ ...p, trainerName: nameMap[p.trainer_id] || "Trainer" })));
        }
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
      }
      setLoading(false);
    })();
  }, []);

  const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const statCards = [
    { label: "Total Students", value: stats.students, icon: Users, color: "text-primary", bg: "bg-primary/10", link: "/admin/students" },
    { label: "Total Trainers", value: stats.trainers, icon: UserCheck, color: "text-primary", bg: "bg-primary/10", link: "/admin/trainers" },
    { label: "Pending Approvals", value: stats.pendingTrainers, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", link: "/admin/trainers" },
    { label: "Total Revenue", value: formatINR(stats.revenue), icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50", link: "/admin/payments" },
    { label: "Active Courses", value: stats.totalCourses, icon: BookOpen, color: "text-primary", bg: "bg-primary/10", link: "/admin/courses" },
    { label: "Active Enrollments", value: stats.activeEnrollments, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", link: "/admin/payments" },
    { label: "Upcoming Sessions", value: stats.activeSessions, icon: Clock, color: "text-primary", bg: "bg-primary/10", link: "/admin/analytics" },
    { label: "Certificates Issued", value: stats.certificates, icon: Award, color: "text-primary", bg: "bg-primary/10", link: "/admin/certificates" },
    { label: "Open Disputes", value: stats.openDisputes, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", link: "/admin/disputes" },
    { label: "Pending Payouts", value: stats.pendingPayouts, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50", link: "/admin/payouts" },
    { label: "Unread Messages", value: stats.contactUnread, icon: MessageSquare, color: "text-primary", bg: "bg-primary/10", link: "/admin/messages" },
    { label: "Total Referrals", value: stats.totalReferrals, icon: Gift, color: "text-primary", bg: "bg-primary/10", link: "/admin/referrals" },
    { label: "Approved Trainers", value: stats.approvedTrainers, icon: UserCheck, color: "text-success", bg: "bg-success/10", link: "/admin/trainers" },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform overview • {formatLongDateIST(new Date())}</p>
        </div>
      </div>

      {/* Pending Approvals Alert Card */}
      {!loading && stats.pendingTrainers > 0 && (
        <Link to="/admin/trainers" className="block mt-6">
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between hover:border-amber-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Pending Trainer Approvals</p>
                <p className="text-sm text-muted-foreground">{stats.pendingTrainers} trainer{stats.pendingTrainers > 1 ? 's' : ''} waiting for review</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{stats.pendingTrainers}</span>
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
            </div>
          </div>
        </Link>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-6">
        {statCards.map(card => (
          <Link key={card.label} to={card.link} className="group">
            <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/20 hover:shadow-sm transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xl font-bold text-foreground">{loading ? "–" : typeof card.value === "number" ? card.value : card.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        {/* Pending Trainer Applications */}
        <div className="bg-white rounded-xl border border-border">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold text-foreground">Pending Trainer Applications</h2>
            <Link to="/admin/trainers" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 skeleton rounded-lg" />)}</div>
            ) : recentTrainers.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending applications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTrainers.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                        <span className="text-amber-600 text-xs font-bold">{t.profileName?.[0] || "T"}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.profileName}</p>
                        <p className="text-xs text-muted-foreground">{(t.skills || []).slice(0, 2).join(", ") || "No skills listed"} • {formatDateIST(t.created_at)}</p>
                      </div>
                    </div>
                    <Link to="/admin/trainers"><Button size="sm" variant="outline" className="text-xs h-7">Review</Button></Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="bg-white rounded-xl border border-border">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold text-foreground">Recent Enrollments</h2>
            <Link to="/admin/payments" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 skeleton rounded-lg" />)}</div>
            ) : recentEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No enrollments yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentEnrollments.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{e.studentName} → {e.courses?.title || "Course"}</p>
                      <p className="text-xs text-muted-foreground">Trainer: {e.trainerName} • {formatDateIST(e.enrollment_date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground ml-3 whitespace-nowrap">{formatINR(Number(e.amount_paid || 0))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Open Disputes */}
        <div className="bg-white rounded-xl border border-border">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold text-foreground">Open Disputes</h2>
            <Link to="/admin/disputes" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-14 skeleton rounded-lg" />)}</div>
            ) : recentDisputes.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No open disputes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDisputes.map((d: any) => (
                  <div key={d.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <p className="text-sm font-medium text-foreground">{d.subject || "Dispute"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{d.description || "No description"}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{formatDateIST(d.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="bg-white rounded-xl border border-border">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold text-foreground">Pending Payouts</h2>
            <Link to="/admin/payouts" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-14 skeleton rounded-lg" />)}</div>
            ) : recentPayouts.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending payouts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentPayouts.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.trainerName}</p>
                      <p className="text-xs text-muted-foreground">{p.upi_id || "Bank transfer"} • {formatDateIST(p.requested_at)}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatINR(Number(p.requested_amount || 0))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Review Trainers", path: "/admin/trainers", icon: UserX },
            { label: "Manage Courses", path: "/admin/courses", icon: BookOpen },
            { label: "View Payments", path: "/admin/payments", icon: IndianRupee },
            { label: "Process Payouts", path: "/admin/payouts", icon: CreditCard },
            { label: "View Analytics", path: "/admin/analytics", icon: TrendingUp },
            { label: "Resolve Disputes", path: "/admin/disputes", icon: AlertTriangle },
            { label: "Contact Messages", path: "/admin/messages", icon: MessageSquare },
          ].map(action => (
            <Link key={action.label} to={action.path}>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
