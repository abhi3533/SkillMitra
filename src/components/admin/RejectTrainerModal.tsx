import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RejectTrainerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  trainerName: string;
}

const RejectTrainerModal = ({ open, onClose, onConfirm, trainerName }: RejectTrainerModalProps) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Trainer Application</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            You are rejecting <span className="font-medium text-foreground">{trainerName}</span>'s application. Please provide a reason.
          </p>
          <div>
            <Label htmlFor="reason" className="text-sm">Rejection Reason *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Insufficient experience, incomplete documents..."
              className="mt-1.5"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>Reject Application</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectTrainerModal;
