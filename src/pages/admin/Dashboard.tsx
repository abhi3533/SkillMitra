import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, DollarSign, BookOpen, Award, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ trainers: 0, pending: 0, students: 0, revenue: 0, activeSessions: 0, certificates: 0 });
  const [recentTrainers, setRecentTrainers] = useState<any[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const [t, p, s, rev, sess, cert] = await Promise.all([
        supabase.from("trainers").select("id", { count: "exact", head: true }),
        supabase.from("trainers").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount").eq("status", "completed"),
        supabase.from("course_sessions").select("id", { count: "exact", head: true }).eq("status", "upcoming").gte("scheduled_at", todayStart).lt("scheduled_at", todayEnd),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
      ]);

      const totalRevenue = (rev.data || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

      setStats({
        trainers: t.count || 0,
        pending: p.count || 0,
        students: s.count || 0,
        revenue: totalRevenue,
        activeSessions: sess.count || 0,
        certificates: cert.count || 0,
      });

      // Recent pending trainers - fetch separately
      const { data: pendingTrainers } = await supabase.from("trainers").select("*").eq("approval_status", "pending").order("created_at", { ascending: false }).limit(5);
      if (pendingTrainers && pendingTrainers.length > 0) {
        const profileMap = await fetchProfilesMap(pendingTrainers.map(t => t.user_id));
        setRecentTrainers(pendingTrainers.map(t => ({ ...t, profileName: profileMap[t.user_id]?.full_name || "Unknown" })));
      }

      // Recent enrollments - fetch separately
      const { data: enrollData } = await supabase.from("enrollments").select("*, courses(title)").order("enrollment_date", { ascending: false }).limit(5);
      if (enrollData && enrollData.length > 0) {
        const studentIds = enrollData.map(e => e.student_id);
        const trainerIds = enrollData.map(e => e.trainer_id);
        
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
        
        setRecentEnrollments(enrollData.map(e => ({
          ...e,
          studentName: studentNameMap[e.student_id] || "Student",
          trainerName: trainerNameMap[e.trainer_id] || "Trainer",
        })));
      }

      setLoading(false);
    })();
  }, []);

  const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Platform overview and management</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-6">
        {[
          { label: "Total Trainers", value: loading ? "-" : String(stats.trainers), icon: Users },
          { label: "Pending Approvals", value: loading ? "-" : String(stats.pending), icon: AlertTriangle },
          { label: "Total Students", value: loading ? "-" : String(stats.students), icon: Users },
          { label: "Total Revenue", value: loading ? "-" : formatINR(stats.revenue), icon: DollarSign },
          { label: "Active Sessions", value: loading ? "-" : String(stats.activeSessions), icon: Clock },
          { label: "Certificates", value: loading ? "-" : String(stats.certificates), icon: Award },
        ].map(card => (
          <div key={card.label} className="bg-card rounded-xl border p-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <card.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Trainer Applications</h2>
          {loading ? <div className="h-16 skeleton rounded-lg" /> :
            recentTrainers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending trainer applications</p>
            ) : recentTrainers.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 mb-2 last:mb-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">{t.profileName?.[0] || "T"}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.profileName}</p>
                    <p className="text-xs text-muted-foreground">{(t.skills || []).slice(0, 2).join(", ")} • {new Date(t.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
                <Link to="/admin/trainers"><Button size="sm" variant="outline" className="text-xs">Review</Button></Link>
              </div>
            ))
          }
        </div>

        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Enrollments</h2>
          {loading ? <div className="h-16 skeleton rounded-lg" /> :
            recentEnrollments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No enrollments yet</p>
            ) : recentEnrollments.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 mb-2 last:mb-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{e.studentName} → {e.courses?.title || "Course"}</p>
                  <p className="text-xs text-muted-foreground">Trainer: {e.trainerName}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{formatINR(Number(e.amount_paid || 0))}</span>
              </div>
            ))
          }
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
