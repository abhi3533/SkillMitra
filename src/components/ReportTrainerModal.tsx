import { useState } from "react";
import { Flag, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const REASONS = [
  "Inappropriate behavior",
  "Fake profile",
  "Poor quality sessions",
  "Other",
];

const ReportTrainerModal = ({ trainerId, trainerName, onClose }: { trainerId: string; trainerName: string; onClose: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast({ title: "Please select a reason", variant: "warning" });
      return;
    }
    if (!user) {
      toast({ title: "Please log in to report", variant: "warning" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("disputes").insert({
        raised_by: user.id,
        subject: `Report Trainer: ${trainerName} — ${reason}`,
        description: description || reason,
        status: "open",
      });
      if (error) throw error;
      toast({ title: "Report submitted", description: "Our team will review this report within 48 hours.", variant: "success" });
      onClose();
    } catch (err: any) {
      toast({ title: "Failed to submit report", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl border border-border shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            <h3 className="text-lg font-semibold text-foreground">Report Trainer</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">Report <strong className="text-foreground">{trainerName}</strong> for a violation. Our team will investigate within 48 hours.</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Reason *</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>
                {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Description (optional)</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide additional details..." className="mt-1.5" rows={4} maxLength={500} />
            <p className="text-xs text-muted-foreground mt-1">{description.length}/500</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Flag className="w-4 h-4 mr-2" />}
              Submit Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportTrainerModal;
