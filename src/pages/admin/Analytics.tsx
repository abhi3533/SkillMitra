import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminAnalytics = () => {
  const [stats, setStats] = useState({ trainers: 0, students: 0, courses: 0, enrollments: 0 });
  const [searches, setSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [t, s, c, e, sl] = await Promise.all([
        supabase.from("trainers").select("id", { count: "exact", head: true }),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("enrollments").select("id", { count: "exact", head: true }),
        supabase.from("search_logs").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      setStats({ trainers: t.count || 0, students: s.count || 0, courses: c.count || 0, enrollments: e.count || 0 });
      setSearches(sl.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
      <p className="mt-1 text-muted-foreground">Platform metrics and insights</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Total Trainers", value: stats.trainers, icon: Users, color: "hero-gradient" },
          { label: "Total Students", value: stats.students, icon: Users, color: "gold-gradient" },
          { label: "Total Courses", value: stats.courses, icon: BookOpen, color: "bg-success" },
          { label: "Total Enrollments", value: stats.enrollments, icon: TrendingUp, color: "hero-gradient" },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border p-5">
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}>
              <c.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{loading ? "-" : c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Search Logs */}
      <div className="mt-8 bg-card rounded-xl border p-6">
        <h3 className="font-semibold text-foreground mb-4">Recent Searches</h3>
        {searches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No search data yet</p>
        ) : (
          <div className="space-y-2">
            {searches.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
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
    </AdminLayout>
  );
};

export default AdminAnalytics;
