import { useState } from "react";
import { Lock, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LOCKED_COURSE_FIELDS = [
  "Course Name",
  "Description",
  "Duration",
  "Curriculum",
  "Course Fee",
  "Time Bands",
  "Session Duration",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle?: string;
}

const RequestCourseUpdateModal = ({ open, onOpenChange, courseTitle }: Props) => {
  const { toast } = useToast();
  const [field, setField] = useState("");
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!field || !reason.trim()) {
      toast({ title: "Please select a field and provide a reason", variant: "warning" });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("request-profile-update", {
        body: {
          field: `[Course: ${courseTitle || "Untitled"}] ${field}`,
          reason: reason.trim(),
        },
      });
      if (error) throw error;
      toast({ title: "Request sent!", description: "Admin will review your course update request." });
      onOpenChange(false);
      setField("");
      setReason("");
    } catch (err: any) {
      toast({ title: "Failed to send request", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Request Course Update
          </DialogTitle>
          <DialogDescription>
            This course is locked after approval. Select the field you'd like to change and tell us why.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Field to Update</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a field..." />
              </SelectTrigger>
              <SelectContent>
                {LOCKED_COURSE_FIELDS.map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reason for Change</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="mt-1.5 min-h-[80px]"
              placeholder="Explain why you need to update this field..."
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{reason.length}/500</p>
          </div>
          <Button onClick={handleSubmit} disabled={sending} className="w-full gap-2">
            <Send className="w-4 h-4" />
            {sending ? "Sending..." : "Submit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestCourseUpdateModal;
