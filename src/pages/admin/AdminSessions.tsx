import { useState, useEffect } from "react";
import { formatDateTimeIST } from "@/lib/dateUtils";
import { Calendar, Search, AlertTriangle, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminSessions = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, missed: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("course_sessions").select("*, enrollments(student_id, courses(title))").order("scheduled_at", { ascending: false }).limit(200);
      const sessData = data || [];

      // Enrich with trainer names
      const trainerIds = [...new Set(sessData.map(s => s.trainer_id))];
      let enriched = sessData;
      if (trainerIds.length > 0) {
        const { data: trainers } = await supabase.from("trainers").select("id, user_id").in("id", trainerIds);
        const userIds = (trainers || []).map(t => t.user_id);
        const profileMap = await fetchProfilesMap(userIds);
        const nameMap: Record<string, string> = {};
        (trainers || []).forEach(t => { nameMap[t.id] = profileMap[t.user_id]?.full_name || "Trainer"; });
        enriched = sessData.map(s => ({ ...s, trainerName: nameMap[s.trainer_id] || "Trainer" }));
      }
      setSessions(enriched);

      setStats({
        total: sessData.length,
        upcoming: sessData.filter(s => s.status === "upcoming").length,
        completed: sessData.filter(s => s.status === "completed").length,
        missed: sessData.filter(s => s.no_show_by).length,
      });
      setLoading(false);
    })();
  }, []);

  const filtered = sessions
    .filter(s => tab === "all" || (tab === "missed" ? !!s.no_show_by : s.status === tab))
    .filter(s => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.title?.toLowerCase().includes(q) || s.trainerName?.toLowerCase().includes(q) || s.enrollments?.courses?.title?.toLowerCase().includes(q);
    });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Session Management</h1>
      <p className="mt-1 text-sm text-muted-foreground">All sessions across the platform</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Total Sessions", value: loading ? "–" : String(stats.total) },
          { label: "Upcoming", value: loading ? "–" : String(stats.upcoming), color: "text-primary" },
          { label: "Completed", value: loading ? "–" : String(stats.completed), color: "text-emerald-600" },
          { label: "Missed/No-show", value: loading ? "–" : String(stats.missed), color: "text-destructive" },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border p-5">
            <p className={`text-xl font-bold ${c.color || "text-foreground"}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="missed">Missed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search session or trainer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">No sessions found</p>
          </div>
        ) : filtered.map(s => (
          <div key={s.id} className="bg-card border rounded-xl p-4 hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-medium text-foreground">{s.title || `Session #${s.session_number}`}</h3>
                  <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                  {s.no_show_by && <Badge variant="destructive" className="text-[10px]">No-show: {s.no_show_by}</Badge>}
                  {s.is_trial && <Badge variant="secondary" className="text-[10px]">Trial</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.enrollments?.courses?.title || "Course"} • Trainer: {s.trainerName}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {s.scheduled_at ? formatDateTimeIST(s.scheduled_at) : "Not scheduled"}
                  {s.duration_mins ? ` • ${s.duration_mins} min` : ""}
                </p>
              </div>
              {s.meet_link && (
                <a href={s.meet_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Video className="w-3 h-3" /> Link
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminSessions;
