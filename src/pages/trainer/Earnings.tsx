import { useState, useEffect } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { DollarSign, TrendingUp, ArrowUpRight, Wallet } from "lucide-react";
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
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: t } = await supabase.from("trainers").select("*").eq("user_id", user.id).maybeSingle();
      setTrainer(t);
      if (t) {
        const { data: p } = await supabase.from("payout_requests").select("*").eq("trainer_id", t.id).order("requested_at", { ascending: false });
        setPayouts(p || []);
        const { data: pays } = await supabase.from("enrollments").select("*, students(*, profiles(full_name)), courses(title)").eq("trainer_id", t.id);
        setPayments(pays || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const requestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (amount < 500) { toast({ title: "Minimum ₹500", variant: "warning" }); return; }
    if (amount > (trainer?.available_balance || 0)) { toast({ title: "Insufficient balance", variant: "warning" }); return; }
    setRequesting(true);
    try {
      const { error } = await supabase.from("payout_requests").insert({
        trainer_id: trainer.id, requested_amount: amount,
        bank_account_number: trainer.bank_account_number, ifsc_code: trainer.ifsc_code, upi_id: trainer.upi_id,
      });
      if (error) throw error;
      await supabase.from("trainers").update({ available_balance: (trainer.available_balance || 0) - amount }).eq("id", trainer.id);
      toast({ title: "Payout requested!", description: "Will be processed within 2-3 business days.", variant: "success" });
      setDialogOpen(false);
      setPayoutAmount("");
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
          <DialogTrigger asChild><Button className="gold-gradient text-accent-foreground border-0"><Wallet className="w-4 h-4 mr-2" />Request Payout</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Request Payout</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Available Balance: <span className="font-bold text-foreground text-lg">₹{trainer?.available_balance?.toLocaleString() || 0}</span></p>
              <div><Input type="number" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} placeholder="Enter amount (min ₹500)" /></div>
              <p className="text-xs text-muted-foreground">Bank: {trainer?.bank_account_number ? `****${trainer.bank_account_number.slice(-4)}` : "Not set"} | UPI: {trainer?.upi_id || "Not set"}</p>
              <Button onClick={requestPayout} disabled={requesting} className="w-full hero-gradient border-0">{requesting ? "Requesting..." : "Confirm Payout"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Available Balance", value: `₹${trainer?.available_balance?.toLocaleString() || 0}`, icon: Wallet, color: "bg-success" },
          { label: "Total Earned", value: `₹${trainer?.total_earnings?.toLocaleString() || 0}`, icon: TrendingUp, color: "hero-gradient" },
          { label: "Total Withdrawn", value: `₹${trainer?.total_withdrawn?.toLocaleString() || 0}`, icon: ArrowUpRight, color: "gold-gradient" },
          { label: "Pending Payouts", value: `₹${payouts.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.requested_amount || 0), 0).toLocaleString()}`, icon: DollarSign, color: "hero-gradient" },
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
                  <p className="text-sm font-medium text-foreground">₹{Number(p.requested_amount).toLocaleString()}</p>
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
