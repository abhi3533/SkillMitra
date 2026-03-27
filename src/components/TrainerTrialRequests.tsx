import { useState, useEffect } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { Check, X, Clock, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { useToast } from "@/hooks/use-toast";

interface Props {
  trainerId: string;
}

const TIME_SLOTS: Record<number, string> = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };
const SLOT_LABELS: Record<string, string> = { "Early Morning": "6 AM", Morning: "9 AM", Afternoon: "12 PM", Evening: "4 PM", Night: "8 PM" };

const TrainerTrialRequests = ({ trainerId }: Props) => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("trial_bookings")
      .select("*, courses(title), students(user_id)")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false });

    const items = data || [];
    if (items.length > 0) {
      const userIds = items.map((b: any) => b.students?.user_id).filter(Boolean);
      const profileMap = await fetchProfilesMap(userIds);
      setBookings(items.map((b: any) => ({
        ...b,
        studentName: profileMap[b.students?.user_id]?.full_name || "Student",
      })));
    } else {
      setBookings([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [trainerId]);

  const handleAction = async (bookingId: string, action: "approve" | "reject", reason?: string) => {
    setActing(bookingId);
    try {
      const { data, error } = await supabase.functions.invoke("trial-approve", {
        body: { trial_booking_id: bookingId, action, rejection_reason: reason },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: action === "approve" ? "Trial Approved! ✅" : "Trial Rejected",
        description: action === "approve" ? "Student has been notified with session details." : "Student has been notified.",
        variant: action === "approve" ? "success" : "default",
      });
      setRejectDialog(null);
      setRejectReason("");
      fetchBookings();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const pending = bookings.filter(b => b.status === "pending");
  const processed = bookings.filter(b => b.status !== "pending");

  if (loading) return null;
  if (bookings.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border">
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Trial Requests</h2>
          {pending.length > 0 && (
            <Badge variant="destructive" className="text-[11px] px-1.5 py-0">{pending.length}</Badge>
          )}
        </div>
      </div>
      <div className="px-5 pb-5 space-y-2">
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No pending trial requests</p>
        )}
        {pending.map(b => (
          <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{b.studentName}</p>
              <p className="text-xs text-muted-foreground">
                {b.courses?.title} • {TIME_SLOTS[b.selected_day] || "TBD"} {SLOT_LABELS[b.selected_slot] || b.selected_slot || ""}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> Requested {formatDateIST(b.created_at)}
              </p>
            </div>
            <div className="flex gap-1.5 ml-3 shrink-0">
              <Button
                size="sm"
                className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                disabled={acting === b.id}
                onClick={() => handleAction(b.id, "approve")}
              >
                {acting === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/5"
                disabled={acting === b.id}
                onClick={() => setRejectDialog(b.id)}
              >
                <X className="w-3 h-3" /> Reject
              </Button>
            </div>
          </div>
        ))}

        {processed.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Recent</p>
            {processed.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 mb-1.5 last:mb-0">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{b.studentName} — {b.courses?.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDateIST(b.created_at)}</p>
                </div>
                <Badge variant={b.status === "approved" ? "default" : "destructive"} className="text-[11px] shrink-0">
                  {b.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectReason(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Trial Request</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              rows={3}
            />
            <Button
              className="w-full"
              variant="destructive"
              disabled={acting === rejectDialog}
              onClick={() => rejectDialog && handleAction(rejectDialog, "reject", rejectReason)}
            >
              {acting === rejectDialog ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerTrialRequests;
