import { useState, useCallback } from "react";
import { formatShortDateIST } from "@/lib/dateUtils";
import { Send, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  trainers: any[];
  loading: boolean;
  search?: string;
  sortBy?: "newest" | "oldest" | "name-asc" | "name-desc" | "status";
  onTrainerClick?: (trainer: any) => void;
  onDeleteTrainer?: (trainer: any) => void;
}

const OnboardingPipeline = ({ trainers, loading, search = "", sortBy = "newest", onTrainerClick, onDeleteTrainer }: Props) => {
  const { toast } = useToast();
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [reminderSentMap, setReminderSentMap] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem("admin_trainer_reminders");
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  const pipeline = trainers
    .filter(t => t.onboarding_status === "draft" || t.onboarding_status === "registered")
    .filter(t => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        t.profiles?.full_name?.toLowerCase().includes(q) ||
        t.profiles?.email?.toLowerCase().includes(q) ||
        (t.skills || []).some((s: string) => s.toLowerCase().includes(q))
      );
    })
    .map(t => {
      const createdAt = new Date(t.created_at);
      const now = new Date();
      const daysSince = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const lastActive = t.last_saved_at ? new Date(t.last_saved_at) : createdAt;
      return { ...t, daysSince, lastActive };
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name-asc":
          return (a.profiles?.full_name || "").localeCompare(b.profiles?.full_name || "");
        case "name-desc":
          return (b.profiles?.full_name || "").localeCompare(a.profiles?.full_name || "");
        case "status": {
          const order: Record<string, number> = { registered: 0, draft: 1 };
          return (order[a.onboarding_status] ?? 2) - (order[b.onboarding_status] ?? 2);
        }
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const sendReminder = async (trainer: any) => {
    const today = new Date().toISOString().slice(0, 10);
    const lastSent = reminderSentMap[trainer.id];
    if (lastSent === today) {
      toast({ title: "Reminder already sent today", description: "Try again tomorrow.", variant: "warning" });
      return;
    }
    setSendingTo(trainer.id);
    try {
      const { error } = await supabase.functions.invoke("onboarding-reminders", {
        body: { trainer_id: trainer.id, reminder_type: "admin_nudge" },
      });
      if (error) throw error;
      const updated = { ...reminderSentMap, [trainer.id]: today };
      setReminderSentMap(updated);
      localStorage.setItem("admin_trainer_reminders", JSON.stringify(updated));
      toast({
        title: "Reminder sent",
        description: `Reminder sent to ${trainer.profiles?.full_name || "trainer"}.`,
        variant: "success",
      });
    } catch {
      toast({ title: "Failed", description: "Could not send reminder.", variant: "destructive" });
    } finally {
      setSendingTo(null);
    }
  };

  const remindAll = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const eligible = pipeline.filter(t => reminderSentMap[t.id] !== today);
    if (eligible.length === 0) {
      toast({ title: "All reminders already sent today", description: "Try again tomorrow.", variant: "warning" });
      return;
    }
    setSendingAll(true);
    let sent = 0;
    let failed = 0;
    const updated = { ...reminderSentMap };
    for (const trainer of eligible) {
      try {
        const { error } = await supabase.functions.invoke("onboarding-reminders", {
          body: { trainer_id: trainer.id, reminder_type: "admin_nudge" },
        });
        if (error) throw error;
        updated[trainer.id] = today;
        sent++;
      } catch {
        failed++;
      }
    }
    setReminderSentMap(updated);
    localStorage.setItem("admin_trainer_reminders", JSON.stringify(updated));
    toast({
      title: `Reminders sent: ${sent}/${sent + failed}`,
      description: failed > 0 ? `${failed} failed to send.` : "All reminders sent successfully.",
      variant: failed > 0 ? "warning" : "success",
    });
    setSendingAll(false);
  }, [pipeline, reminderSentMap, toast]);

  const stepColor = (step: number) => {
    if (step === 0) return "bg-destructive/10 text-destructive";
    if (step < 2) return "bg-amber-50 text-amber-700";
    if (step < 3) return "bg-blue-50 text-blue-700";
    return "bg-emerald-50 text-emerald-700";
  };

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-card rounded-xl border animate-pulse" />)}</div>;
  }

  if (pipeline.length === 0) {
    return <p className="text-center text-muted-foreground py-12">No trainers in onboarding pipeline</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-xs"
          disabled={sendingAll}
          onClick={remindAll}
        >
          <Send className="w-3.5 h-3.5" />
          {sendingAll ? "Sending..." : `Remind All (${pipeline.length})`}
        </Button>
      </div>
      <div className="border rounded-xl overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[18%] min-w-[120px]">Trainer</TableHead>
            <TableHead className="hidden sm:table-cell w-[14%] min-w-[120px]">Mobile</TableHead>
            <TableHead className="hidden md:table-cell w-[20%] min-w-[150px]">Email</TableHead>
            <TableHead className="hidden lg:table-cell w-[10%] min-w-[80px]">Signup Date</TableHead>
            <TableHead className="w-[7%] min-w-[55px] text-center">Step</TableHead>
            <TableHead className="hidden sm:table-cell w-[10%] min-w-[80px]">Last Active</TableHead>
            <TableHead className="w-[6%] min-w-[45px] text-center">Days</TableHead>
            <TableHead className="text-right w-[15%] min-w-[130px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pipeline.map(t => (
            <TableRow key={t.id} className={onTrainerClick ? "cursor-pointer hover:bg-muted/50" : ""} onClick={() => onTrainerClick?.(t)}>
              <TableCell className="font-medium text-foreground">
                <span className={onTrainerClick ? "text-primary hover:underline" : ""}>
                  {t.profiles?.full_name || "Unknown"}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                {t.profiles?.phone ? (
                  <a href={`tel:${t.profiles.phone}`} className="flex items-center gap-1 hover:text-primary">
                    <Phone className="w-3 h-3" />
                    {t.profiles.phone}
                  </a>
                ) : "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground text-sm truncate max-w-[180px]">
                {t.profiles?.email || "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                {formatShortDateIST(t.created_at)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className={`text-xs ${stepColor(Math.min(t.onboarding_step || 0, 3))}`}>
                  {Math.min(t.onboarding_step || 0, 3)}/3
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                {formatShortDateIST(t.lastActive)}
              </TableCell>
              <TableCell className="text-center">
                <span className={`text-sm font-medium ${t.daysSince >= 3 ? "text-destructive" : t.daysSince >= 1 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {t.daysSince}d
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-xs px-2"
                    disabled={sendingTo === t.id}
                    onClick={(e) => { e.stopPropagation(); sendReminder(t); }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingTo === t.id ? "Sending..." : "Remind"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(t); }}
                    title="Delete trainer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pipeline Trainer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.profiles?.full_name || "this trainer"}</strong>? This cannot be undone. Their account will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              if (!deleteTarget) return;
              const trainerName = deleteTarget.profiles?.full_name || "Trainer";
              const { error } = await supabase.from("trainers").delete().eq("id", deleteTarget.id);
              if (error) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
                setDeleteTarget(null);
                return;
              }
              if (deleteTarget.user_id) {
                supabase.functions.invoke("delete-auth-user", { body: { user_id: deleteTarget.user_id } }).catch(console.error);
              }
              toast({ title: "Trainer deleted", description: `${trainerName} has been permanently removed.` });
              onDeleteTrainer?.(deleteTarget);
              setDeleteTarget(null);
            }}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default OnboardingPipeline;
