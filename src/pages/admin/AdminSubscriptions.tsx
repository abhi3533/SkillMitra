import { useState, useEffect } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { CreditCard, Search, AlertTriangle, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminSubscriptions = () => {
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [stats, setStats] = useState({ total: 0, active: 0, revenue: 0, expiringSoon: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("trainer_subscriptions").select("*, trainers(user_id)").order("created_at", { ascending: false });
      const subsData = data || [];

      const userIds = subsData.map(s => s.trainers?.user_id).filter(Boolean);
      const profileMap = await fetchProfilesMap(userIds);
      const nameMap: Record<string, string> = {};
      subsData.forEach(s => { if (s.trainers?.user_id) nameMap[s.trainer_id] = profileMap[s.trainers.user_id]?.full_name || "Trainer"; });

      const enriched = subsData.map(s => ({ ...s, trainerName: nameMap[s.trainer_id] || "Trainer" }));
      setSubs(enriched);

      const now = new Date();
      const in7days = new Date(now.getTime() + 7 * 86400000);
      setStats({
        total: subsData.length,
        active: subsData.filter(s => s.status === "active").length,
        revenue: subsData.filter(s => s.status === "active").reduce((sum, s) => sum + Number(s.amount || 0), 0),
        expiringSoon: subsData.filter(s => s.status === "active" && s.end_date && new Date(s.end_date) <= in7days).length,
      });
      setLoading(false);
    })();
  }, []);

  const filtered = subs
    .filter(s => tab === "all" || s.status === tab)
    .filter(s => !search || s.trainerName?.toLowerCase().includes(search.toLowerCase()) || s.plan?.toLowerCase().includes(search.toLowerCase()));

  const statusColor = (s: string) =>
    s === "active" ? "bg-emerald-50 text-emerald-700" :
    s === "cancelled" ? "bg-destructive/10 text-destructive" :
    "bg-amber-50 text-amber-700";

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Subscription Management</h1>
      <p className="mt-1 text-sm text-muted-foreground">All trainer subscription plans</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Total Subscriptions", value: loading ? "–" : String(stats.total) },
          { label: "Active Plans", value: loading ? "–" : String(stats.active), color: "text-emerald-600" },
          { label: "Monthly Revenue", value: loading ? "–" : `₹${stats.revenue.toLocaleString("en-IN")}`, color: "text-primary" },
          { label: "Expiring Soon", value: loading ? "–" : String(stats.expiringSoon), color: stats.expiringSoon > 0 ? "text-destructive" : "text-foreground" },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border p-5">
            <p className={`text-xl font-bold ${c.color || "text-foreground"}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {stats.expiringSoon > 0 && !loading && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">{stats.expiringSoon} subscription(s) expiring within 7 days</p>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All ({subs.length})</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search trainer or plan..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
      </div>

      <div className="mt-4 bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-secondary/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Trainer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Start</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">End</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-4"><Skeleton className="h-12" /><Skeleton className="h-12 mt-2" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center">
                  <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">No subscriptions found</p>
                </td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-secondary/20">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{s.trainerName}</td>
                  <td className="px-4 py-3 text-sm text-foreground capitalize">{s.plan || "basic"}</td>
                  <td className="px-4 py-3 text-sm text-foreground">₹{Number(s.amount || 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(s.status)}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.start_date ? formatDateIST(s.start_date) : "-"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.end_date ? formatDateIST(s.end_date) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
