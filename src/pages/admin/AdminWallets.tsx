import { useState, useEffect } from "react";
import { Wallet, IndianRupee, Search, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminWallets = () => {
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("wallets");
  const [stats, setStats] = useState({ totalBalance: 0, totalEarned: 0, totalWithdrawn: 0 });

  useEffect(() => {
    (async () => {
      const [{ data: w }, { data: tx }] = await Promise.all([
        supabase.from("wallets").select("*").order("balance", { ascending: false }),
        supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(100),
      ]);

      const walletsData = w || [];
      const txData = tx || [];

      // Enrich with user names
      const userIds = [...new Set([...walletsData.map(w => w.user_id), ...txData.map(t => t.user_id)])];
      const profileMap = await fetchProfilesMap(userIds);

      setWallets(walletsData.map(w => ({ ...w, userName: profileMap[w.user_id]?.full_name || "User" })));
      setTransactions(txData.map(t => ({ ...t, userName: profileMap[t.user_id]?.full_name || "User" })));

      setStats({
        totalBalance: walletsData.reduce((s, w) => s + Number(w.balance || 0), 0),
        totalEarned: walletsData.reduce((s, w) => s + Number(w.total_earned || 0), 0),
        totalWithdrawn: walletsData.reduce((s, w) => s + Number(w.total_withdrawn || 0), 0),
      });
      setLoading(false);
    })();
  }, []);

  const filteredWallets = wallets.filter(w => !search || w.userName?.toLowerCase().includes(search.toLowerCase()));
  const filteredTx = transactions.filter(t => !search || t.userName?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Wallet Management</h1>
      <p className="mt-1 text-sm text-muted-foreground">View all user wallets and transactions</p>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { label: "Total Platform Liability", value: `₹${stats.totalBalance.toLocaleString("en-IN")}`, color: "text-primary" },
          { label: "Total Earned Across Users", value: `₹${stats.totalEarned.toLocaleString("en-IN")}`, color: "text-emerald-600" },
          { label: "Total Withdrawn", value: `₹${stats.totalWithdrawn.toLocaleString("en-IN")}`, color: "text-amber-600" },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border p-5">
            <p className={`text-xl font-bold ${c.color}`}>{loading ? "–" : c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="wallets">Wallets ({wallets.length})</TabsTrigger>
            <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search user..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
      </div>

      {tab === "wallets" ? (
        <div className="mt-4 bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Balance</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Total Earned</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Total Withdrawn</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Last Updated</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-4"><Skeleton className="h-12" /><Skeleton className="h-12 mt-2" /></td></tr>
                ) : filteredWallets.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center">
                    <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">No wallets found</p>
                  </td></tr>
                ) : filteredWallets.map(w => (
                  <tr key={w.id} className="border-b last:border-0 hover:bg-secondary/20">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{w.userName}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">₹{Number(w.balance).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600">₹{Number(w.total_earned).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">₹{Number(w.total_withdrawn).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{w.last_updated ? new Date(w.last_updated).toLocaleDateString("en-IN") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : filteredTx.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border">
              <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">No transactions found</p>
            </div>
          ) : filteredTx.map(t => (
            <div key={t.id} className="bg-card border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.type === "credit" ? "bg-emerald-50 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                  {t.type === "credit" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.userName} — {t.description || t.type}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(t.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
              <p className={`text-sm font-semibold ${t.type === "credit" ? "text-emerald-600" : "text-destructive"}`}>
                {t.type === "credit" ? "+" : "−"}₹{Number(t.amount).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminWallets;
