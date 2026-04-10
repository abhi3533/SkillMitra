import { useState, useEffect } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { CreditCard, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminPayouts = () => {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("payout_requests").select("*, trainers(*, profiles(full_name))").order("requested_at", { ascending: false });
      setPayouts(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const processPayout = async (id: string, status: string, txRef?: string) => {
    const updates: any = { status, processed_at: new Date().toISOString() };
    if (txRef) updates.transaction_reference = txRef;
    const { error } = await supabase.from("payout_requests").update(updates).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const payout = payouts.find(p => p.id === id);

    // When a payout is rejected, credit the deducted amount back to the trainer's wallet
    if (status === "rejected" && payout?.trainers?.user_id && payout?.requested_amount) {
      const { error: rpcError } = await supabase.rpc("credit_wallet_atomic", {
        p_user_id: payout.trainers.user_id,
        p_amount: Number(payout.requested_amount),
        p_description: "Payout request rejected — amount reversed",
        p_reference_id: id,
      });
      if (rpcError) {
        console.error("Wallet reversal failed:", rpcError);
        toast({ title: "Payout rejected", description: "Status updated but wallet reversal failed. Contact support.", variant: "warning" });
      }
    }

    setPayouts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    toast({ title: `Payout ${status}`, variant: "success" });

    // Notify trainer of payout decision
    supabase.functions.invoke("notify-payout-status", {
      body: {
        payout_request_id: id,
        action: status === "completed" ? "approved" : "rejected",
        ...(txRef ? { transaction_reference: txRef } : {}),
      },
    }).catch(console.error);

    // Log activity
    supabase.from("admin_activity_log").insert({
      event_type: status === "completed" ? "payout_approved" : "payout_rejected",
      title: `Payout ${status === "completed" ? "Approved" : "Rejected"}`,
      description: `₹${Number(payout?.requested_amount || 0).toLocaleString()} payout for ${payout?.trainers?.profiles?.full_name || "Trainer"} ${status}${txRef ? ` — Ref: ${txRef}` : ""}`,
      metadata: { payout_id: id, trainer_id: payout?.trainer_id, amount: payout?.requested_amount, status },
    });
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Payout Management</h1>
      <p className="mt-1 text-muted-foreground">Process trainer payout requests</p>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-card rounded-xl border p-5">
          <p className="text-xl font-bold text-foreground">₹{payouts.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.requested_amount || 0), 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending Amount</p>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <p className="text-xl font-bold text-foreground">{payouts.filter(p => p.status === "pending").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending Requests</p>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <p className="text-xl font-bold text-foreground">₹{payouts.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.processed_amount || p.requested_amount || 0), 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Processed This Month</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-20 bg-card rounded-xl border animate-pulse" />)
        ) : payouts.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground mt-4">No payout requests</p>
          </div>
        ) : payouts.map(p => (
          <div key={p.id} className="bg-card rounded-xl border p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{p.trainers?.profiles?.full_name || "Trainer"}</p>
              <p className="text-sm text-muted-foreground">₹{Number(p.requested_amount).toLocaleString()} • {p.bank_account_number ? `****${p.bank_account_number.slice(-4)}` : ""} • UPI: {p.upi_id || "-"}</p>
              <p className="text-xs text-muted-foreground">{formatDateIST(p.requested_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "completed" ? "bg-success/10 text-success" : p.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{p.status}</span>
              {p.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => processPayout(p.id, "completed", "TXN" + Date.now())} className="bg-success text-success-foreground border-0"><Check className="w-3 h-3 mr-1" />Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => processPayout(p.id, "rejected")}><X className="w-3 h-3" /></Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminPayouts;
