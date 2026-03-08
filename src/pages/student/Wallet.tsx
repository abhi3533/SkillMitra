import { useState, useEffect } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, IndianRupee, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StudentLayout from "@/components/layouts/StudentLayout";

const StudentWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [{ data: w }, { data: tx }] = await Promise.all([
        supabase.from("wallets").select("*").eq("user_id", user.id).single(),
        supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setWallet(w);
      setTransactions(tx || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = transactions.filter(t => filter === "all" || t.type === filter);

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">My Wallet</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your credits and transaction history</p>

        {/* Balance Card */}
        {loading ? (
          <Skeleton className="h-36 mt-6 rounded-xl" />
        ) : (
          <div className="mt-6 bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-primary-foreground">
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
              <Wallet className="w-4 h-4" /> Available Balance
            </div>
            <p className="text-3xl font-bold mt-2 flex items-center">
              <IndianRupee className="w-7 h-7" />{Number(wallet?.balance || 0).toLocaleString("en-IN")}
            </p>
            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <p className="text-primary-foreground/70">Total Earned</p>
                <p className="font-semibold">₹{Number(wallet?.total_earned || 0).toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70">Total Spent</p>
                <p className="font-semibold">₹{Number(wallet?.total_withdrawn || 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Transactions</h2>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <Filter className="w-3 h-3 mr-1" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="credit">Credits</SelectItem>
                <SelectItem value="debit">Debits</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border">
              <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Earn credits by referring friends!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(t => (
                <div key={t.id} className="bg-card border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      t.type === "credit" ? "bg-emerald-50 text-emerald-600" : "bg-destructive/10 text-destructive"
                    }`}>
                      {t.type === "credit" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.description || (t.type === "credit" ? "Credit" : "Debit")}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${t.type === "credit" ? "text-emerald-600" : "text-destructive"}`}>
                    {t.type === "credit" ? "+" : "−"}₹{Number(t.amount).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentWallet;
