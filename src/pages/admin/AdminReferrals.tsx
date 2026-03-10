import { useState, useEffect } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { Users, Gift, IndianRupee, TrendingUp, Search, Download, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminReferrals = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("student");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentRefs, setStudentRefs] = useState<any[]>([]);
  const [trainerRefs, setTrainerRefs] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalRefs: 0, totalCredits: 0, topReferrers: [] as any[] });

  const loadData = async () => {
    setLoading(true);
    const [{ data: sRefs }, { data: tRefs }] = await Promise.all([
      supabase.from("referrals").select("*").order("created_at", { ascending: false }),
      supabase.from("trainer_referrals").select("*").order("created_at", { ascending: false }),
    ]);

    const sData = sRefs || [];
    const sStudentIds = [...new Set([...sData.map(r => r.referrer_id), ...sData.map(r => r.referred_id).filter(Boolean)])];
    let enrichedS: any[] = sData;
    if (sStudentIds.length > 0) {
      const { data: students } = await supabase.from("students").select("id, user_id").in("id", sStudentIds);
      const userIds = (students || []).map(s => s.user_id);
      const profileMap = await fetchProfilesMap(userIds);
      const nameMap: Record<string, string> = {};
      (students || []).forEach(s => { nameMap[s.id] = profileMap[s.user_id]?.full_name || "Student"; });
      enrichedS = sData.map(r => ({ ...r, referrerName: nameMap[r.referrer_id] || "Unknown", referredName: nameMap[r.referred_id] || "Pending" }));
    }
    setStudentRefs(enrichedS);

    const tData = tRefs || [];
    const tTrainerIds = [...new Set([...tData.map(r => r.referrer_id), ...tData.map(r => r.referred_id).filter(Boolean)])];
    let enrichedT: any[] = tData;
    if (tTrainerIds.length > 0) {
      const { data: trainers } = await supabase.from("trainers").select("id, user_id").in("id", tTrainerIds);
      const userIds = (trainers || []).map(t => t.user_id);
      const profileMap = await fetchProfilesMap(userIds);
      const nameMap: Record<string, string> = {};
      (trainers || []).forEach(t => { nameMap[t.id] = profileMap[t.user_id]?.full_name || "Trainer"; });
      enrichedT = tData.map(r => ({ ...r, referrerName: nameMap[r.referrer_id] || "Unknown", referredName: nameMap[r.referred_id] || "Pending" }));
    }
    setTrainerRefs(enrichedT);

    const totalRefs = sData.length + tData.length;
    const totalCredits = sData.filter(r => r.status === "paid").reduce((s, r) => s + Number(r.reward_amount || 0), 0)
      + tData.filter(r => r.status === "paid").reduce((s, r) => s + Number(r.reward_amount || 0), 0);

    const referrerCounts: Record<string, { name: string; count: number; earned: number }> = {};
    enrichedS.forEach(r => {
      if (!referrerCounts[r.referrer_id]) referrerCounts[r.referrer_id] = { name: r.referrerName, count: 0, earned: 0 };
      referrerCounts[r.referrer_id].count++;
      if (r.status === "paid") referrerCounts[r.referrer_id].earned += Number(r.reward_amount || 0);
    });
    const topReferrers = Object.values(referrerCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    setStats({ totalRefs, totalCredits, topReferrers });
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleOverride = async (id: string, table: "referrals" | "trainer_referrals", newStatus: string) => {
    const { error } = await supabase.from(table).update({ status: newStatus }).eq("id", id);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Referral marked as ${newStatus}`, variant: "success" });
      loadData();
    }
  };

  const exportCSV = () => {
    const currentRefs = tab === "student" ? studentRefs : trainerRefs;
    const headers = ["Referrer", "Referred", "Code", "Reward", "Status", "Date"];
    const rows = currentRefs.map(r => [
      r.referrerName, r.referredName || "Pending", r.referral_code || "-",
      r.reward_amount, r.status, formatDateIST(r.created_at),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referrals-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentRefs = tab === "student" ? studentRefs : trainerRefs;
  const currentTable = tab === "student" ? "referrals" : "trainer_referrals";
  const filtered = currentRefs.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return r.referrerName?.toLowerCase().includes(q) || r.referredName?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Referral Management</h1>
      <p className="mt-1 text-sm text-muted-foreground">Track all referrals across the platform</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Total Referrals", value: loading ? "–" : String(stats.totalRefs), icon: Users, bg: "bg-primary/10", color: "text-primary" },
          { label: "Student Referrals", value: loading ? "–" : String(studentRefs.length), icon: Users, bg: "bg-primary/10", color: "text-primary" },
          { label: "Trainer Referrals", value: loading ? "–" : String(trainerRefs.length), icon: Users, bg: "bg-accent/10", color: "text-accent" },
          { label: "Total Rewards Paid", value: loading ? "–" : `₹${stats.totalCredits.toLocaleString("en-IN")}`, icon: IndianRupee, bg: "bg-emerald-50", color: "text-emerald-600" },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border p-4">
            <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className="text-xl font-bold text-foreground">{c.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Top Referrers */}
      {!loading && stats.topReferrers.length > 0 && (
        <div className="mt-6 bg-card rounded-xl border p-5">
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Top Referrers</h2>
          <div className="space-y-2">
            {stats.topReferrers.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground w-6">#{i + 1}</span>
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{r.count} referrals</p>
                  <p className="text-xs text-emerald-600">₹{r.earned.toLocaleString("en-IN")} earned</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs, Search, Filter, Export */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="student">Student ({studentRefs.length})</TabsTrigger>
              <TabsTrigger value="trainer">Trainer ({trainerRefs.length})</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 h-9">
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-secondary/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Referrer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Referred</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Code</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Reward</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-4"><Skeleton className="h-16" /><Skeleton className="h-16 mt-2" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">No referrals found</p>
                </td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-secondary/20">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{r.referrerName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.referredName || "Pending"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{r.referral_code || "-"}</td>
                  <td className="px-4 py-3 text-sm text-foreground">₹{Number(r.reward_amount || 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    {r.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs h-7"
                        onClick={() => handleOverride(r.id, currentTable as "referrals" | "trainer_referrals", "paid")}
                      >
                        <CheckCircle className="w-3 h-3" /> Mark Paid
                      </Button>
                    )}
                    {r.status === "paid" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs h-7 text-muted-foreground"
                        onClick={() => handleOverride(r.id, currentTable as "referrals" | "trainer_referrals", "pending")}
                      >
                        <Clock className="w-3 h-3" /> Revert
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReferrals;
