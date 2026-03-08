import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, BookOpen, Star, Award, AlertTriangle, Calendar, IndianRupee, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORS = ["hsl(221,79%,49%)", "hsl(38,92%,50%)", "hsl(142,72%,39%)", "hsl(0,84%,60%)", "hsl(262,83%,58%)", "hsl(180,60%,40%)"];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ trainers: 0, students: 0, courses: 0, enrollments: 0 });
  const [healthCards, setHealthCards] = useState({
    sessionsThisMonth: 0, avgRating: 0, certificatesIssued: 0, disputeResolution: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [signupData, setSignupData] = useState<any[]>([]);
  const [topTrainers, setTopTrainers] = useState<any[]>([]);
  const [skillsData, setSkillsData] = useState<any[]>([]);
  const [citiesData, setCitiesData] = useState<any[]>([]);
  const [searches, setSearches] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [t, s, c, e, sl] = await Promise.all([
        supabase.from("trainers").select("id", { count: "exact", head: true }),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("enrollments").select("id", { count: "exact", head: true }),
        supabase.from("search_logs").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      setStats({ trainers: t.count || 0, students: s.count || 0, courses: c.count || 0, enrollments: e.count || 0 });
      setSearches(sl.data || []);

      // Health cards
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const [sessionsRes, ratingsRes, certsRes, disputesRes, resolvedRes] = await Promise.all([
        supabase.from("course_sessions").select("id", { count: "exact", head: true }).eq("status", "completed").gte("scheduled_at", monthStart),
        supabase.from("trainers").select("average_rating"),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
        supabase.from("disputes").select("id", { count: "exact", head: true }),
        supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "resolved"),
      ]);

      const ratings = (ratingsRes.data || []).map(r => Number(r.average_rating)).filter(r => r > 0);
      const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "0";
      const totalDisputes = disputesRes.count || 0;
      const resolvedDisputes = resolvedRes.count || 0;

      setHealthCards({
        sessionsThisMonth: sessionsRes.count || 0,
        avgRating: Number(avgRating),
        certificatesIssued: certsRes.count || 0,
        disputeResolution: totalDisputes > 0 ? Math.round((resolvedDisputes / totalDisputes) * 100) : 100,
      });

      // Revenue data (last 12 months from payments)
      const { data: payments } = await supabase.from("payments").select("amount, created_at").eq("status", "captured");
      const monthlyRev: Record<string, number> = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        monthlyRev[key] = 0;
      }
      (payments || []).forEach(p => {
        const d = new Date(p.created_at || "");
        const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        if (key in monthlyRev) monthlyRev[key] += Number(p.amount);
      });
      setRevenueData(Object.entries(monthlyRev).map(([month, revenue]) => ({ month, revenue })));

      // Signups per week (last 8 weeks)
      const weeksData: any[] = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - i * 7 * 86400000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
        const label = `W${8 - i}`;
        const { count: sc } = await supabase.from("students").select("id", { count: "exact", head: true })
          .gte("created_at", weekStart.toISOString()).lt("created_at", weekEnd.toISOString());
        const { count: tc } = await supabase.from("trainers").select("id", { count: "exact", head: true })
          .gte("created_at", weekStart.toISOString()).lt("created_at", weekEnd.toISOString());
        weeksData.push({ week: label, students: sc || 0, trainers: tc || 0 });
      }
      setSignupData(weeksData);

      // Top trainers by earnings
      const { data: trainersData } = await supabase.from("trainers").select("id, user_id, total_earnings, total_students, average_rating")
        .order("total_earnings", { ascending: false }).limit(5);
      if (trainersData && trainersData.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", trainersData.map(t2 => t2.user_id));
        const pMap: Record<string, string> = {};
        (profiles || []).forEach(p => { pMap[p.id] = p.full_name || "Trainer"; });
        setTopTrainers(trainersData.map(t2 => ({
          name: pMap[t2.user_id] || "Trainer",
          earnings: Number(t2.total_earnings) || 0,
          students: t2.total_students || 0,
          rating: Number(t2.average_rating) || 0,
        })));
      }

      // Popular skills
      const { data: allTrainers } = await supabase.from("trainers").select("skills");
      const skillCount: Record<string, number> = {};
      (allTrainers || []).forEach(t2 => {
        (t2.skills || []).forEach((sk: string) => { skillCount[sk] = (skillCount[sk] || 0) + 1; });
      });
      setSkillsData(Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value })));

      // Top cities
      const { data: allProfiles } = await supabase.from("profiles").select("city");
      const cityCount: Record<string, number> = {};
      (allProfiles || []).forEach(p => { if (p.city) cityCount[p.city] = (cityCount[p.city] || 0) + 1; });
      setCitiesData(Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([city, count]) => ({ city, count })));

      setLoading(false);
    })();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
      <p className="mt-1 text-muted-foreground">Platform metrics, revenue, and insights</p>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Total Trainers", value: stats.trainers, icon: Users, color: "bg-primary/10", iconColor: "text-primary" },
          { label: "Total Students", value: stats.students, icon: Users, color: "bg-accent/10", iconColor: "text-accent" },
          { label: "Total Courses", value: stats.courses, icon: BookOpen, color: "bg-emerald-50", iconColor: "text-emerald-600" },
          { label: "Enrollments", value: stats.enrollments, icon: TrendingUp, color: "bg-primary/10", iconColor: "text-primary" },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border border-border p-5">
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}>
              <c.icon className={`w-5 h-5 ${c.iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{loading ? "–" : c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Platform Health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {[
          { label: "Sessions This Month", value: healthCards.sessionsThisMonth, icon: Calendar },
          { label: "Avg Platform Rating", value: healthCards.avgRating, icon: Star },
          { label: "Certificates Issued", value: healthCards.certificatesIssued, icon: Award },
          { label: "Dispute Resolution", value: `${healthCards.disputeResolution}%`, icon: AlertTriangle },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "–" : c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        {/* Revenue Line Chart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Revenue (Last 12 Months)</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(215,16%,47%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(215,16%,47%)" />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="hsl(221,79%,49%)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No payment data yet</p>
          )}
        </div>

        {/* Signups Bar Chart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">New Signups (Last 8 Weeks)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={signupData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(215,16%,47%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(215,16%,47%)" allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="students" name="Students" fill="hsl(221,79%,49%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="trainers" name="Trainers" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Skills Pie Chart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Popular Skills</h3>
          {skillsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={skillsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {skillsData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No skill data yet</p>
          )}
        </div>

        {/* Top Trainers Table */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Top 5 Trainers by Earnings</h3>
          {topTrainers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">#</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Trainer</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Earnings</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Students</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Rating</th>
                </tr></thead>
                <tbody>
                  {topTrainers.map((t, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2.5 text-muted-foreground">{i + 1}</td>
                      <td className="py-2.5 font-medium text-foreground">{t.name}</td>
                      <td className="py-2.5 text-right text-foreground">₹{t.earnings.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{t.students}</td>
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 text-accent fill-accent" />{t.rating}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No trainer data yet</p>
          )}
        </div>
      </div>

      {/* Cities + Search Logs */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Top 10 Cities by Students</h3>
          {citiesData.length > 0 ? (
            <div className="space-y-2">
              {citiesData.map((c, i) => (
                <div key={c.city} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <span className="text-sm font-medium text-foreground">{c.city}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{c.count} users</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No city data yet</p>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Recent Searches</h3>
          {searches.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No search data yet</p>
          ) : (
            <div className="space-y-2">
              {searches.slice(0, 10).map(s => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                  <p className="text-sm text-foreground">{s.search_query}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{s.results_count} results</span>
                    <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
