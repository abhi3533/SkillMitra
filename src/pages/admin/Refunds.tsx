import { useEffect, useState } from "react";
import { Check, X, RefreshCw, IndianRupee, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import { formatDateTimeIST } from "@/lib/dateUtils";

type RefundRequest = {
  id: string;
  enrollment_id: string;
  student_user_id: string;
  trainer_user_id: string | null;
  course_title: string | null;
  amount: number;
  trainer_payout: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  studentName?: string;
  trainerName?: string;
};

const AdminRefunds = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [dialog, setDialog] = useState<{ req: RefundRequest; action: "approve" | "reject" } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("refund_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast({ title: "Failed to load", description: error.message, variant: "destructive" }); setLoading(false); return; }

    const userIds = Array.from(new Set([
      ...(data || []).map((r: any) => r.student_user_id),
      ...(data || []).map((r: any) => r.trainer_user_id).filter(Boolean),
    ]));
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
    const nameMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => { nameMap[p.id] = p.full_name || "—"; });

    setRequests((data || []).map((r: any) => ({
      ...r,
      studentName: nameMap[r.student_user_id] || "Student",
      trainerName: r.trainer_user_id ? (nameMap[r.trainer_user_id] || "Trainer") : "—",
    })));
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const openDialog = (req: RefundRequest, action: "approve" | "reject") => {
    setDialog({ req, action });
    setAdminNotes("");
  };

  const submit = async () => {
    if (!dialog) return;
    if (dialog.action === "reject" && !adminNotes.trim()) {
      toast({ title: "Reason required", description: "Please provide a reason for rejecting", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("admin-process-refund", {
      body: { request_id: dialog.req.id, action: dialog.action, admin_notes: adminNotes.trim() || null },
    });
    setSubmitting(false);
    if (error || (data as any)?.error) {
      toast({ title: "Failed", description: (data as any)?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: dialog.action === "approve" ? "Refund approved & processed" : "Refund rejected", variant: "success" });
    setDialog(null);
    fetchRequests();
  };

  const filtered = requests.filter(r => r.status === activeTab);
  const counts = {
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Refund Requests</h1>
            <p className="text-sm text-muted-foreground mt-1">Review and approve student refund requests. Money only moves after your approval.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRequests}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="pending">Pending {counts.pending > 0 && <Badge variant="destructive" className="ml-2">{counts.pending}</Badge>}</TabsTrigger>
            <TabsTrigger value="approved">Approved <span className="ml-2 text-xs text-muted-foreground">({counts.approved})</span></TabsTrigger>
            <TabsTrigger value="rejected">Rejected <span className="ml-2 text-xs text-muted-foreground">({counts.rejected})</span></TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="bg-card border rounded-xl p-12 text-center">
                <IndianRupee className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No {activeTab} refund requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(r => (
                  <div key={r.id} className="bg-card border rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[260px]">
                        <h3 className="font-semibold text-foreground">{r.course_title || "Course"}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          <span className="font-medium text-foreground">{r.studentName}</span> → trainer <span className="font-medium text-foreground">{r.trainerName}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Requested {formatDateTimeIST(r.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">₹{Number(r.amount).toLocaleString("en-IN")}</p>
                        <p className="text-[11px] text-muted-foreground">debits ₹{Number(r.trainer_payout).toLocaleString("en-IN")} from trainer</p>
                      </div>
                    </div>

                    {r.reason && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Student's reason</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{r.reason}</p>
                      </div>
                    )}

                    {r.admin_notes && (
                      <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Admin note</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{r.admin_notes}</p>
                      </div>
                    )}

                    {r.status === "pending" ? (
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" onClick={() => openDialog(r, "approve")} className="bg-green-600 hover:bg-green-700">
                          <Check className="w-4 h-4 mr-1" /> Approve & Refund
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openDialog(r, "reject")}>
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={r.status === "approved" ? "default" : "secondary"} className={r.status === "approved" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                          {r.status}
                        </Badge>
                        {r.processed_at && <span>on {formatDateTimeIST(r.processed_at)}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.action === "approve" ? "Approve Refund Request" : "Reject Refund Request"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.action === "approve"
                ? `This will debit ₹${Number(dialog?.req.trainer_payout || 0).toLocaleString("en-IN")} from the trainer's wallet, credit ₹${Number(dialog?.req.amount || 0).toLocaleString("en-IN")} to the student's wallet, cancel future sessions, and free up booked slots.`
                : "Provide a clear reason — this will be sent to the student via email and shown on their dashboard."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {dialog?.action === "approve" ? "Admin note (optional)" : "Reason for rejection"} {dialog?.action === "reject" && <span className="text-destructive">*</span>}
            </label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={dialog?.action === "approve" ? "Optional message for the student/trainer..." : "Explain why this request can't be approved..."}
              rows={4}
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={submitting}>Cancel</Button>
            <Button
              onClick={submit}
              disabled={submitting}
              className={dialog?.action === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={dialog?.action === "reject" ? "destructive" : "default"}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {dialog?.action === "approve" ? "Confirm & Refund" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRefunds;
