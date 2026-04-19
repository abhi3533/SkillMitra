import { useState, useEffect } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { DollarSign, TrendingUp, ArrowUpRight, Wallet, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TrainerLayout from "@/components/layouts/TrainerLayout";

const TrainerEarnings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trainer, setTrainer] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const REQUIRED_SESSIONS = 5;

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ data: t }, { data: w }] = await Promise.all([
        supabase.from("trainers").select("id, bank_account_number, ifsc_code, upi_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setTrainer(t);
      setWallet(w);
      if (t) {
        const [{ data: p }, { count: completedCount }] = await Promise.all([
          supabase.from("payout_requests").select("*").eq("trainer_id", t.id).order("requested_at", { ascending: false }),
          supabase.from("course_sessions").select("id", { count: "exact", head: true }).eq("trainer_id", t.id).eq("status", "completed"),
        ]);
        setPayouts(p || []);
        setCompletedSessions(completedCount ?? 0);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const hasEnoughSessions = completedSessions >= REQUIRED_SESSIONS;

  const totalBalance = Number(wallet?.balance || 0);
  const withdrawableBalance = hasConfirmedBooking ? totalBalance : 0;
  const totalEarned = Number(wallet?.total_earned || 0);
  const totalWithdrawn = Number(wallet?.total_withdrawn || 0);

  const requestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (amount < 500) { toast({ title: "Minimum ₹500", variant: "warning" }); return; }
    if (amount > withdrawableBalance) { toast({ title: "Insufficient withdrawable balance", variant: "warning" }); return; }
    if (!trainer || !wallet) return;
    setRequesting(true);
    try {
      const { error } = await supabase.from("payout_requests").insert({
        trainer_id: trainer.id, requested_amount: amount,
        bank_account_number: trainer.bank_account_number, ifsc_code: trainer.ifsc_code, upi_id: trainer.upi_id,
      });
      if (error) throw error;
      await supabase.from("wallets").update({
        balance: totalBalance - amount,
        total_withdrawn: totalWithdrawn + amount,
        last_updated: new Date().toISOString(),
      }).eq("id", wallet.id);
      await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        user_id: user!.id,
        type: "debit",
        amount,
        description: "Payout withdrawal request",
        reference_id: trainer.id,
      });
      toast({ title: "Payout requested!", description: "Will be processed within 2-3 business days.", variant: "success" });
      setDialogOpen(false);
      setPayoutAmount("");
      setWallet({ ...wallet, balance: totalBalance - amount, total_withdrawn: totalWithdrawn + amount });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <TrainerLayout>
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Earnings</h1><p className="mt-1 text-muted-foreground">Track your income and request payouts</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gold-gradient text-accent-foreground border-0" disabled={!hasConfirmedBooking}>
              {!hasConfirmedBooking && <Lock className="w-4 h-4 mr-2" />}
              {hasConfirmedBooking && <Wallet className="w-4 h-4 mr-2" />}
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Request Payout</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Withdrawable Balance: <span className="font-bold text-foreground text-lg">₹{withdrawableBalance.toLocaleString("en-IN")}</span></p>
              <div><Input type="number" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} placeholder="Enter amount (min ₹500)" /></div>
              <p className="text-xs text-muted-foreground">Bank: {trainer?.bank_account_number ? `****${trainer.bank_account_number.slice(-4)}` : "Not set"} | UPI: {trainer?.upi_id || "Not set"}</p>
              <Button onClick={requestPayout} disabled={requesting} className="w-full hero-gradient border-0">{requesting ? "Requesting..." : "Confirm Payout"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Booking lock banner */}
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Total Balance", value: `₹${totalBalance.toLocaleString("en-IN")}`, icon: Wallet, color: "bg-success" },
          { label: "Withdrawable", value: `₹${withdrawableBalance.toLocaleString("en-IN")}`, icon: hasConfirmedBooking ? Wallet : Lock, color: hasConfirmedBooking ? "hero-gradient" : "bg-muted" },
          { label: "Total Earned", value: `₹${totalEarned.toLocaleString("en-IN")}`, icon: TrendingUp, color: "hero-gradient" },
          { label: "Total Withdrawn", value: `₹${totalWithdrawn.toLocaleString("en-IN")}`, icon: ArrowUpRight, color: "gold-gradient" },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border p-5">
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}>
              <c.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Payout History */}
      {payouts.length > 0 && (
        <div className="mt-6 bg-card rounded-xl border p-6">
          <h3 className="font-semibold text-foreground mb-4">Payout History</h3>
          <div className="space-y-2">
            {payouts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div>
                  <p className="text-sm font-medium text-foreground">₹{Number(p.requested_amount).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground">{formatDateIST(p.requested_at)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "completed" ? "bg-success/10 text-success" : p.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </TrainerLayout>
  );
};

export default TrainerEarnings;