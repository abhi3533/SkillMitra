import { useState, useEffect } from "react";
import { formatDateTimeIST } from "@/lib/dateUtils";
import { Wallet, ArrowUpRight, ArrowDownLeft, IndianRupee, Filter, Banknote, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import TrainerLayout from "@/components/layouts/TrainerLayout";

const TrainerWallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showPayout, setShowPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [trainerData, setTrainerData] = useState<any>(null);
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(false);
  const [hasMoreTx, setHasMoreTx] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const TX_LIMIT = 50;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [{ data: w }, { data: tx }, { data: t }] = await Promise.all([
        supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(TX_LIMIT),
        supabase.from("trainers").select("id, upi_id, bank_account_number, ifsc_code").eq("user_id", user.id).maybeSingle(),
      ]);
      setWallet(w);
      setTransactions(tx || []);
      setHasMoreTx((tx?.length ?? 0) === TX_LIMIT);
      setTrainerId(t?.id || null);
      setTrainerData(t);

      // Check if trainer has at least one confirmed enrollment
      if (t?.id) {
        const { count } = await supabase
          .from("enrollments")
          .select("id", { count: "exact", head: true })
          .eq("trainer_id", t.id)
          .in("status", ["active", "completed"]);
        setHasConfirmedBooking((count ?? 0) > 0);
      }

      setLoading(false);
    };
    load();
  }, [user]);

  const loadMoreTransactions = async () => {
    if (!user || loadingMore) return;
    setLoadingMore(true);
    const { data: more } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(transactions.length, transactions.length + TX_LIMIT - 1);
    if (more) {
      setTransactions(prev => [...prev, ...more]);
      setHasMoreTx(more.length === TX_LIMIT);
    }
    setLoadingMore(false);
  };

  const totalBalance = Number(wallet?.balance || 0);
  const withdrawableBalance = hasConfirmedBooking ? totalBalance : 0;

  const requestPayout = async () => {
    const amount = Number(payoutAmount);
    if (amount < 500) { toast({ title: "Minimum ₹500 required", variant: "warning" }); return; }
    if (amount > withdrawableBalance) { toast({ title: "Insufficient withdrawable balance", variant: "warning" }); return; }
    if (!trainerId || !wallet) return;

    setRequesting(true);

    // Debit the wallet FIRST — if this fails, no payout row is created and there
    // is no orphaned record. Previously the insert came first, which left a pending
    // payout_requests row whenever the RPC subsequently failed.
    const { error: rpcError } = await supabase.rpc("credit_wallet_atomic", {
      p_user_id: user!.id,
      p_amount: -amount,
      p_description: "Payout withdrawal request",
      p_reference_id: trainerId,
    });

    if (rpcError) {
      console.error("Wallet debit RPC failed:", rpcError);
      toast({ title: "Failed to submit", description: "Could not debit wallet. Please try again.", variant: "destructive" });
      setRequesting(false);
      return;
    }

    // Wallet debited — now record the payout request.
    const { data: payoutRow, error } = await supabase.from("payout_requests").insert({
      trainer_id: trainerId,
      requested_amount: amount,
      upi_id: trainerData?.upi_id,
      bank_account_number: trainerData?.bank_account_number,
      ifsc_code: trainerData?.ifsc_code,
    }).select("id").single();

    if (error) {
      // Wallet was already debited but the row failed — log prominently for manual recovery.
      console.error("Payout request insert failed after wallet debit:", error);
      toast({ title: "Partial failure", description: "Balance deducted but request record failed. Contact support.", variant: "warning" });
    } else {
      // Update total_withdrawn counter — safe to do non-atomically: it only ever grows
      // and payout requests are user-initiated sequentially (button disabled during request).
      const newWithdrawn = Number(wallet.total_withdrawn || 0) + amount;
      await supabase.from("wallets").update({
        total_withdrawn: newWithdrawn,
        last_updated: new Date().toISOString(),
      }).eq("id", wallet.id);

      // Re-fetch wallet and transactions so UI reflects the atomically updated balance
      // and the transaction record created by the RPC.
      const [{ data: refreshedWallet }, { data: refreshedTx }] = await Promise.all([
        supabase.from("wallets").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("wallet_transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(TX_LIMIT),
      ]);
      if (refreshedWallet) setWallet(refreshedWallet);
      if (refreshedTx) { setTransactions(refreshedTx); setHasMoreTx(refreshedTx.length === TX_LIMIT); }

      toast({ title: "Payout requested", description: `₹${amount} withdrawal request submitted`, variant: "success" });
      if (payoutRow?.id) {
        supabase.functions.invoke("notify-payout-status", {
          body: { payout_request_id: payoutRow.id, action: "requested" },
        }).catch(console.error);
      }
      setShowPayout(false);
      setPayoutAmount("");
    }
    setRequesting(false);
  };

  const filtered = transactions.filter(t => filter === "all" || t.type === filter);

  return (
    <TrainerLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">My Wallet</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your earnings and manage withdrawals</p>

        {loading ? (
          <Skeleton className="h-36 mt-6 rounded-xl" />
        ) : (
          <div className="mt-6 bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-primary-foreground">
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
              <Wallet className="w-4 h-4" /> Total Balance
            </div>
            <p className="text-3xl font-bold mt-2 flex items-center">
              <IndianRupee className="w-7 h-7" />{totalBalance.toLocaleString("en-IN")}
            </p>
            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <p className="text-primary-foreground/70">Withdrawable</p>
                <p className="font-semibold flex items-center gap-1">
                  ₹{withdrawableBalance.toLocaleString("en-IN")}
                  {!hasConfirmedBooking && <Lock className="w-3 h-3" />}
                </p>
              </div>
              <div>
                <p className="text-primary-foreground/70">Total Earned</p>
                <p className="font-semibold">₹{Number(wallet?.total_earned || 0).toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70">Withdrawn</p>
                <p className="font-semibold">₹{Number(wallet?.total_withdrawn || 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        )}

        {/* No booking message */}
        {!loading && !hasConfirmedBooking && totalBalance > 0 && (
          <div className="mt-4 p-4 bg-accent/10 border border-accent/30 rounded-xl flex items-start gap-3">
            <Lock className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Withdrawals locked</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get your first student to unlock withdrawals! Your balance will become withdrawable once your first student booking is confirmed.
              </p>
            </div>
          </div>
        )}

        {/* Payout CTA */}
        {!loading && (
          <div className="mt-4 p-4 bg-card border rounded-xl">
            {!hasConfirmedBooking ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Request Withdrawal</p>
                    <p className="text-xs text-muted-foreground">Withdrawal available after your first student booking is confirmed</p>
                  </div>
                </div>
                <Button size="sm" disabled>
                  <Lock className="w-3 h-3 mr-1" />Withdraw
                </Button>
              </div>
            ) : withdrawableBalance >= 500 ? (
              !showPayout ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Request Withdrawal</p>
                      <p className="text-xs text-muted-foreground">Min ₹500 • Processed within 3-5 days</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setShowPayout(true)}>Withdraw</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Enter withdrawal amount</p>
                  <Input type="number" placeholder="Min ₹500" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} className="h-9" />
                  <p className="text-xs text-muted-foreground">
                    {trainerData?.upi_id ? `UPI: ${trainerData.upi_id}` : trainerData?.bank_account_number ? `Bank: ****${trainerData.bank_account_number.slice(-4)}` : "Add bank details in Profile first"}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={requestPayout} disabled={requesting || !payoutAmount}>
                      {requesting ? "Submitting..." : "Request Payout"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowPayout(false)}>Cancel</Button>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center gap-3">
                <Banknote className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Request Withdrawal</p>
                  <p className="text-xs text-muted-foreground">Min ₹500 required • Current withdrawable: ₹{withdrawableBalance.toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}
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
              <p className="text-xs text-muted-foreground mt-1">Earnings from courses and referrals will appear here</p>
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
                      <p className="text-[11px] text-muted-foreground">{formatDateTimeIST(t.created_at)}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${t.type === "credit" ? "text-emerald-600" : "text-destructive"}`}>
                    {t.type === "credit" ? "+" : "−"}₹{Number(t.amount).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          )}
          {hasMoreTx && !loading && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" onClick={loadMoreTransactions} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </TrainerLayout>
  );
};

export default TrainerWallet;