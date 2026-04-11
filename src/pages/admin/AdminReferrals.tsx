import { useState, useEffect, useMemo } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { Users, Gift, IndianRupee, TrendingUp, Search, Download, CheckCircle, Clock, Wallet, Filter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";

interface EnrichedRef {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string | null;
  reward_amount: number;
  status: string;
  created_at: string;
  referrerName: string;
  referrerEmail: string;
  referredName: string;
  referredEmail: string;
}

interface WalletRow {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  userName: string;
  userEmail: string;
  role: string;
}

interface WalletTx {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  userName: string;
}

const statusColor: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  approved: "bg-blue-50 text-blue-700",
  enrolled: "bg-blue-50 text-blue-700",
  rejected: "bg-red-50 text-red-700",
};

const AdminReferrals = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("trainer");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [trainerRefs, setTrainerRefs] = useState<EnrichedRef[]>([]);
  const [studentRefs, setStudentRefs] = useState<EnrichedRef[]>([]);
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [walletTxs, setWalletTxs] = useState<WalletTx[]>([]);
  const [walletTxOffset, setWalletTxOffset] = useState(0);
  const [hasMoreTxs, setHasMoreTxs] = useState(false);
  const [walletSearch, setWalletSearch] = useState("");
  const TX_PAGE_SIZE = 50;
  const [deleteRefTarget, setDeleteRefTarget] = useState<{ id: string; table: "referrals" | "trainer_referrals"; name: string } | null>(null);
  const loadData = async () => {
    setLoading(true);

    const [{ data: tRefs }, { data: sRefs }, { data: allWallets }, { data: allTxs }] = await Promise.all([
      supabase.from("trainer_referrals").select("*").order("created_at", { ascending: false }),
      supabase.from("referrals").select("*").order("created_at", { ascending: false }),
      supabase.from("wallets").select("*").order("balance", { ascending: false }),
      supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(TX_PAGE_SIZE),
    ]);

    // Enrich trainer referrals
    const tData = tRefs || [];
    const tTrainerIds = [...new Set([...tData.map(r => r.referrer_id), ...tData.map(r => r.referred_id).filter(Boolean)])];
    let enrichedT: EnrichedRef[] = [];
    if (tTrainerIds.length > 0) {
      const { data: trainers } = await supabase.from("trainers").select("id, user_id").in("id", tTrainerIds as string[]);
      const userIds = (trainers || []).map(t => t.user_id);
      const profileMap = await fetchProfilesMap(userIds);
      const nameMap: Record<string, { name: string; email: string }> = {};
      (trainers || []).forEach(t => {
        nameMap[t.id] = { name: profileMap[t.user_id]?.full_name || "Trainer", email: profileMap[t.user_id]?.email || "" };
      });
      enrichedT = tData.map(r => ({
        ...r, reward_amount: Number(r.reward_amount || 0),
        referrerName: nameMap[r.referrer_id]?.name || "Unknown", referrerEmail: nameMap[r.referrer_id]?.email || "",
        referredName: r.referred_id ? (nameMap[r.referred_id]?.name || "Pending") : "Pending",
        referredEmail: r.referred_id ? (nameMap[r.referred_id]?.email || "") : "",
      }));
    }
    setTrainerRefs(enrichedT);

    // Enrich student referrals
    const sData = sRefs || [];
    const sStudentIds = [...new Set([...sData.map(r => r.referrer_id), ...sData.map(r => r.referred_id).filter(Boolean)])];
    let enrichedS: EnrichedRef[] = [];
    if (sStudentIds.length > 0) {
      const { data: students } = await supabase.from("students").select("id, user_id").in("id", sStudentIds as string[]);
      const userIds = (students || []).map(s => s.user_id);
      const profileMap = await fetchProfilesMap(userIds);
      const nameMap: Record<string, { name: string; email: string }> = {};
      (students || []).forEach(s => {
        nameMap[s.id] = { name: profileMap[s.user_id]?.full_name || "Student", email: profileMap[s.user_id]?.email || "" };
      });
      enrichedS = sData.map(r => ({
        ...r, reward_amount: Number(r.reward_amount || 0),
        referrerName: nameMap[r.referrer_id]?.name || "Unknown", referrerEmail: nameMap[r.referrer_id]?.email || "",
        referredName: r.referred_id ? (nameMap[r.referred_id]?.name || "Pending") : "Pending",
        referredEmail: r.referred_id ? (nameMap[r.referred_id]?.email || "") : "",
      }));
    }
    setStudentRefs(enrichedS);

    // Enrich wallets
    const wData = allWallets || [];
    if (wData.length > 0) {
      const walletUserIds = wData.map(w => w.user_id);
      const profileMap = await fetchProfilesMap(walletUserIds);
      // Determine roles
      const [{ data: studs }, { data: trns }] = await Promise.all([
        supabase.from("students").select("user_id").in("user_id", walletUserIds),
        supabase.from("trainers").select("user_id").in("user_id", walletUserIds),
      ]);
      const studentUserIds = new Set((studs || []).map(s => s.user_id));
      const trainerUserIds = new Set((trns || []).map(t => t.user_id));

      setWallets(wData.map(w => ({
        ...w,
        userName: profileMap[w.user_id]?.full_name || "Unknown",
        userEmail: profileMap[w.user_id]?.email || "",
        role: trainerUserIds.has(w.user_id) ? "Trainer" : studentUserIds.has(w.user_id) ? "Student" : "Unknown",
      })));
    }

    // Enrich transactions
    const txData = allTxs || [];
    if (txData.length > 0) {
      const txUserIds = [...new Set(txData.map(t => t.user_id))];
      const profileMap = await fetchProfilesMap(txUserIds);
      setWalletTxs(txData.map(t => ({
        ...t,
        userName: profileMap[t.user_id]?.full_name || "Unknown",
      })));
    } else {
      setWalletTxs([]);
    }
    setWalletTxOffset(0);
    setHasMoreTxs(txData.length === TX_PAGE_SIZE);

    setLoading(false);
  };

  const loadMoreTxs = async () => {
    const newOffset = walletTxOffset + TX_PAGE_SIZE;
    const { data: moreTxs } = await supabase
      .from("wallet_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .range(newOffset, newOffset + TX_PAGE_SIZE - 1);
    if (!moreTxs || moreTxs.length === 0) { setHasMoreTxs(false); return; }
    const txUserIds = [...new Set(moreTxs.map(t => t.user_id))];
    const profileMap = await fetchProfilesMap(txUserIds);
    const enriched = moreTxs.map(t => ({ ...t, userName: profileMap[t.user_id]?.full_name || "Unknown" }));
    setWalletTxs(prev => [...prev, ...enriched]);
    setWalletTxOffset(newOffset);
    setHasMoreTxs(moreTxs.length === TX_PAGE_SIZE);
  };

  useEffect(() => { loadData(); }, []);

  const handleOverride = async (id: string, table: "referrals" | "trainer_referrals", newStatus: string) => {
    if (newStatus === "paid") {
      // For trainer referrals, verify the referred trainer is approved before crediting reward
      if (table === "trainer_referrals") {
        const ref = trainerRefs.find(r => r.id === id);
        if (ref?.referred_id) {
          const { data: tRow } = await supabase
            .from("trainers")
            .select("approval_status")
            .eq("id", ref.referred_id)
            .maybeSingle();
          if (tRow?.approval_status !== "approved") {
            toast({
              title: "Trainer not approved",
              description: "The referred trainer must be approved before marking this referral as paid.",
              variant: "warning",
            });
            return;
          }
        }
      }

      // Use edge function to credit wallet + update status + send notifications
      try {
        const { data, error } = await supabase.functions.invoke("admin-mark-referral-paid", {
          body: { referral_id: id, table },
        });
        if (error) throw error;
        if (data && !data.success) throw new Error(data.error || "Failed to process");
        toast({ title: "Referral Paid", description: "Status updated, wallet credited, and notification sent." });
        loadData();
      } catch (err: any) {
        toast({ title: "Failed to process", description: err.message, variant: "destructive" });
      }
    } else {
      // For revert (paid → pending) — reverse the wallet credit before updating status
      // so the referrer does not keep the reward after the revert.
      const allRefs = [...trainerRefs, ...studentRefs];
      const ref = allRefs.find(r => r.id === id);
      if (ref?.status === "paid" && ref.reward_amount > 0) {
        // Resolve referrer's auth user_id from the trainer/student row
        let referrerUserId: string | null = null;
        if (table === "trainer_referrals") {
          const { data: t } = await supabase.from("trainers").select("user_id").eq("id", ref.referrer_id).maybeSingle();
          referrerUserId = t?.user_id ?? null;
        } else {
          const { data: s } = await supabase.from("students").select("user_id").eq("id", ref.referrer_id).maybeSingle();
          referrerUserId = s?.user_id ?? null;
        }
        if (referrerUserId) {
          const { error: rpcError } = await supabase.rpc("credit_wallet_atomic", {
            p_user_id: referrerUserId,
            p_amount: -ref.reward_amount,
            p_description: "Referral reward reversed by admin",
            p_reference_id: id,
          });
          if (rpcError) {
            console.error("Wallet reversal failed on revert:", rpcError);
            toast({ title: "Reversal failed", description: "Could not reverse wallet credit. Revert aborted.", variant: "destructive" });
            return;
          }
        }
      }

      const { error } = await supabase.from(table).update({ status: newStatus }).eq("id", id);
      if (error) {
        toast({ title: "Failed to update", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Updated", description: `Referral marked as ${newStatus}` });
        loadData();
      }
    }
  };

  // Filter helper
  const filterRefs = (refs: EnrichedRef[]) => refs.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (dateFrom && r.created_at < dateFrom) return false;
    if (dateTo && r.created_at > dateTo + "T23:59:59") return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return r.referrerName?.toLowerCase().includes(q) || r.referredName?.toLowerCase().includes(q) ||
      r.referrerEmail?.toLowerCase().includes(q) || r.referredEmail?.toLowerCase().includes(q) ||
      r.referral_code?.toLowerCase().includes(q);
  });

  const filteredTrainer = filterRefs(trainerRefs);
  const filteredStudent = filterRefs(studentRefs);

  const filteredWallets = wallets.filter(w => {
    if (!walletSearch) return true;
    const q = walletSearch.toLowerCase();
    return w.userName.toLowerCase().includes(q) || w.userEmail.toLowerCase().includes(q);
  });

  // Summary stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const totalPaidThisMonth = useMemo(() => {
    const tPaid = trainerRefs.filter(r => r.status === "paid" && r.created_at >= monthStart).reduce((s, r) => s + r.reward_amount, 0);
    const sPaid = studentRefs.filter(r => r.status === "paid" && r.created_at >= monthStart).reduce((s, r) => s + r.reward_amount, 0);
    return tPaid + sPaid;
  }, [trainerRefs, studentRefs]);

  const totalActiveCodes = useMemo(() => {
    const tCodes = new Set(trainerRefs.map(r => r.referral_code).filter(Boolean));
    const sCodes = new Set(studentRefs.map(r => r.referral_code).filter(Boolean));
    return tCodes.size + sCodes.size;
  }, [trainerRefs, studentRefs]);

  const pendingRewards = useMemo(() => {
    return [...trainerRefs, ...studentRefs].filter(r => r.status === "pending").reduce((s, r) => s + r.reward_amount, 0);
  }, [trainerRefs, studentRefs]);

  const totalPlatformLiability = useMemo(() => wallets.reduce((s, w) => s + Number(w.balance || 0), 0), [wallets]);

  const topReferrers = useMemo(() => {
    const counts: Record<string, { name: string; count: number; earned: number }> = {};
    [...trainerRefs, ...studentRefs].forEach(r => {
      const key = r.referrer_id;
      if (!counts[key]) counts[key] = { name: r.referrerName, count: 0, earned: 0 };
      counts[key].count++;
      if (r.status === "paid") counts[key].earned += r.reward_amount;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [trainerRefs, studentRefs]);

  const exportCSV = () => {
    const refs = tab === "trainer" ? filteredTrainer : filteredStudent;
    const headers = ["Referrer", "Referrer Email", "Referred", "Referred Email", "Code", "Reward", "Status", "Date"];
    const rows = refs.map(r => [
      r.referrerName, r.referrerEmail, r.referredName, r.referredEmail,
      r.referral_code || "-", r.reward_amount, r.status, formatDateIST(r.created_at),
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

  const exportWalletsCSV = () => {
    const headers = ["Name", "Email", "Role", "Balance", "Total Earned", "Total Withdrawn"];
    const rows = filteredWallets.map(w => [w.userName, w.userEmail, w.role, w.balance, w.total_earned, w.total_withdrawn]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wallets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ReferralTable = ({ data, table }: { data: EnrichedRef[]; table: "referrals" | "trainer_referrals" }) => (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30">
              <TableHead className="text-xs">Referrer</TableHead>
              <TableHead className="text-xs">Referred</TableHead>
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Reward</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="p-4"><Skeleton className="h-16" /><Skeleton className="h-16 mt-2" /></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="px-4 py-12 text-center">
                <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No referrals found</p>
              </TableCell></TableRow>
            ) : data.map(r => (
              <TableRow key={r.id}>
                <TableCell>
                  <p className="text-sm font-medium text-foreground">{r.referrerName}</p>
                  <p className="text-xs text-muted-foreground">{r.referrerEmail}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-foreground">{r.referredName}</p>
                  <p className="text-xs text-muted-foreground">{r.referredEmail}</p>
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{r.referral_code || "-"}</TableCell>
                <TableCell className="text-sm font-medium text-foreground">₹{r.reward_amount.toLocaleString("en-IN")}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[r.status] || "bg-muted text-muted-foreground"}`}>{r.status}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDateIST(r.created_at)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {r.status === "pending" && (
                      <Button variant="ghost" size="sm" className="gap-1 text-xs h-7"
                        onClick={() => handleOverride(r.id, table, "paid")}>
                        <CheckCircle className="w-3 h-3" /> Mark Paid
                      </Button>
                    )}
                    {r.status === "paid" && (
                      <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-muted-foreground"
                        onClick={() => handleOverride(r.id, table, "pending")}>
                        <Clock className="w-3 h-3" /> Revert
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteRefTarget({ id: r.id, table, name: r.referrerName })} title="Delete referral">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Referral Management</h1>
      <p className="mt-1 text-sm text-muted-foreground">Track all referrals, wallets, and rewards across the platform</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Rewards Paid This Month", value: loading ? "–" : `₹${totalPaidThisMonth.toLocaleString("en-IN")}`, icon: IndianRupee, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Active Referral Codes", value: loading ? "–" : String(totalActiveCodes), icon: Gift, bg: "bg-primary/10", color: "text-primary" },
          { label: "Pending Rewards", value: loading ? "–" : `₹${pendingRewards.toLocaleString("en-IN")}`, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Platform Wallet Liability", value: loading ? "–" : `₹${totalPlatformLiability.toLocaleString("en-IN")}`, icon: Wallet, bg: "bg-blue-50", color: "text-blue-600" },
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
      {!loading && topReferrers.length > 0 && (
        <div className="mt-6 bg-card rounded-xl border p-5">
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Top 5 Referrers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {topReferrers.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground w-6">#{i + 1}</span>
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-foreground">{r.count}</p>
                  <p className="text-[10px] text-emerald-600">₹{r.earned.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setSearch(""); setStatusFilter("all"); }} className="mt-6">
        <TabsList>
          <TabsTrigger value="trainer">Trainer Referrals ({trainerRefs.length})</TabsTrigger>
          <TabsTrigger value="student">Student Referrals ({studentRefs.length})</TabsTrigger>
          <TabsTrigger value="wallets">Wallet Overview</TabsTrigger>
        </TabsList>

        {/* Filters for referral tabs */}
        {(tab === "trainer" || tab === "student") && (
          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 w-36 text-sm" placeholder="From" />
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 w-36 text-sm" placeholder="To" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search name, email, code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 h-9">
                <Download className="w-3.5 h-3.5" /> CSV
              </Button>
            </div>
          </div>
        )}

        <TabsContent value="trainer" className="mt-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-card rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total Trainer Referrals</p>
              <p className="text-lg font-bold text-foreground">{trainerRefs.length}</p>
            </div>
            <div className="bg-card rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Paid Out</p>
              <p className="text-lg font-bold text-emerald-600">₹{trainerRefs.filter(r => r.status === "paid").reduce((s, r) => s + r.reward_amount, 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-card rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-bold text-amber-600">{trainerRefs.filter(r => r.status === "pending").length}</p>
            </div>
          </div>
          <ReferralTable data={filteredTrainer} table="trainer_referrals" />
        </TabsContent>

        <TabsContent value="student" className="mt-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-card rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total Student Referrals</p>
              <p className="text-lg font-bold text-foreground">{studentRefs.length}</p>
            </div>
            <div className="bg-card rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Paid Out (₹500/referral)</p>
              <p className="text-lg font-bold text-emerald-600">₹{studentRefs.filter(r => r.status === "paid").reduce((s, r) => s + r.reward_amount, 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-card rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-bold text-amber-600">{studentRefs.filter(r => r.status === "pending").length}</p>
            </div>
          </div>
          <ReferralTable data={filteredStudent} table="referrals" />
        </TabsContent>

        <TabsContent value="wallets" className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
            <div className="grid grid-cols-3 gap-4 flex-1">
              <div className="bg-card rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Total Wallets</p>
                <p className="text-lg font-bold text-foreground">{wallets.length}</p>
              </div>
              <div className="bg-card rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Platform Liability</p>
                <p className="text-lg font-bold text-blue-600">₹{totalPlatformLiability.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-card rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Total Earned (All)</p>
                <p className="text-lg font-bold text-emerald-600">₹{wallets.reduce((s, w) => s + Number(w.total_earned || 0), 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={walletSearch} onChange={e => setWalletSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Button variant="outline" size="sm" onClick={exportWalletsCSV} className="gap-1.5 h-9">
              <Download className="w-3.5 h-3.5" /> CSV
            </Button>
          </div>
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30">
                    <TableHead className="text-xs">User</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Balance</TableHead>
                    <TableHead className="text-xs">Total Earned</TableHead>
                    <TableHead className="text-xs">Total Withdrawn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="p-4"><Skeleton className="h-16" /></TableCell></TableRow>
                  ) : filteredWallets.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="py-12 text-center">
                      <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                      <p className="text-sm text-muted-foreground mt-2">No wallets found</p>
                    </TableCell></TableRow>
                  ) : filteredWallets.map(w => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{w.userName}</p>
                        <p className="text-xs text-muted-foreground">{w.userEmail}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={w.role === "Trainer" ? "default" : "secondary"} className="text-[10px]">{w.role}</Badge>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-foreground">₹{Number(w.balance || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-sm text-emerald-600">₹{Number(w.total_earned || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">₹{Number(w.total_withdrawn || 0).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Recent Transactions */}
          {walletTxs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Recent Transactions</h3>
              <div className="bg-card rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/30">
                        <TableHead className="text-xs">User</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {walletTxs.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm text-foreground">{tx.userName}</TableCell>
                          <TableCell>
                            <Badge variant={tx.type === "credit" ? "default" : "secondary"} className="text-[10px]">{tx.type}</Badge>
                          </TableCell>
                          <TableCell className={`text-sm font-medium ${tx.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                            {tx.type === "credit" ? "+" : "-"}₹{Math.abs(Number(tx.amount)).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{tx.description}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDateIST(tx.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {hasMoreTxs && (
                <div className="mt-3 text-center">
                  <Button variant="outline" size="sm" onClick={loadMoreTxs}>Load More</Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Referral Confirmation */}
      <Dialog open={!!deleteRefTarget} onOpenChange={() => setDeleteRefTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Referral</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this referral by <strong>{deleteRefTarget?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRefTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              if (!deleteRefTarget) return;

              // If the referral was already paid, reverse the wallet credit before deleting
              // so the referrer does not keep the reward with no audit trail.
              const allRefs = [...trainerRefs, ...studentRefs];
              const ref = allRefs.find(r => r.id === deleteRefTarget.id);
              if (ref?.status === "paid" && ref.reward_amount > 0) {
                let referrerUserId: string | null = null;
                if (deleteRefTarget.table === "trainer_referrals") {
                  const { data: t } = await supabase.from("trainers").select("user_id").eq("id", ref.referrer_id).maybeSingle();
                  referrerUserId = t?.user_id ?? null;
                } else {
                  const { data: s } = await supabase.from("students").select("user_id").eq("id", ref.referrer_id).maybeSingle();
                  referrerUserId = s?.user_id ?? null;
                }
                if (referrerUserId) {
                  const { error: rpcError } = await supabase.rpc("credit_wallet_atomic", {
                    p_user_id: referrerUserId,
                    p_amount: -ref.reward_amount,
                    p_description: "Referral reward reversed — referral deleted by admin",
                    p_reference_id: deleteRefTarget.id,
                  });
                  if (rpcError) {
                    console.error("Wallet reversal failed on delete:", rpcError);
                    toast({ title: "Reversal failed", description: "Could not reverse wallet credit. Delete aborted.", variant: "destructive" });
                    setDeleteRefTarget(null);
                    return;
                  }
                }
              }

              const { error } = await supabase.from(deleteRefTarget.table).delete().eq("id", deleteRefTarget.id);
              if (error) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
              } else {
                toast({ title: "Referral deleted", description: "Referral record has been removed." });
                loadData();
              }
              setDeleteRefTarget(null);
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReferrals;
