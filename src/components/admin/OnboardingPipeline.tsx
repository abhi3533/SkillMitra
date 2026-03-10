import { useState } from "react";
import { Send, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  trainers: any[];
  loading: boolean;
}

const OnboardingPipeline = ({ trainers, loading }: Props) => {
  const { toast } = useToast();
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const pipeline = trainers
    .filter(t => t.onboarding_status === "draft" || (t.onboarding_status === "pending" && (t.onboarding_step || 0) < 6))
    .map(t => {
      const createdAt = new Date(t.created_at);
      const now = new Date();
      const daysSince = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const lastActive = t.last_saved_at ? new Date(t.last_saved_at) : createdAt;
      return { ...t, daysSince, lastActive };
    })
    .sort((a, b) => b.daysSince - a.daysSince);

  const sendReminder = async (trainer: any) => {
    setSendingTo(trainer.id);
    try {
      const { error } = await supabase.functions.invoke("onboarding-reminders", {
        body: { trainer_id: trainer.id },
      });
      if (error) throw error;
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

  const stepColor = (step: number) => {
    if (step === 0) return "bg-destructive/10 text-destructive";
    if (step < 3) return "bg-amber-50 text-amber-700";
    if (step < 6) return "bg-blue-50 text-blue-700";
    return "bg-emerald-50 text-emerald-700";
  };

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-card rounded-xl border animate-pulse" />)}</div>;
  }

  if (pipeline.length === 0) {
    return <p className="text-center text-muted-foreground py-12">No trainers in onboarding pipeline</p>;
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trainer</TableHead>
            <TableHead className="hidden sm:table-cell">Mobile</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden lg:table-cell">Signup Date</TableHead>
            <TableHead>Step</TableHead>
            <TableHead className="hidden sm:table-cell">Last Active</TableHead>
            <TableHead>Days</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pipeline.map(t => (
            <TableRow key={t.id}>
              <TableCell className="font-medium text-foreground">
                {t.profiles?.full_name || "Unknown"}
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
              <TableCell>
                <Badge variant="secondary" className={`text-xs ${stepColor(t.onboarding_step || 0)}`}>
                  {t.onboarding_step || 0}/6
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                {t.lastActive.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </TableCell>
              <TableCell>
                <span className={`text-sm font-medium ${t.daysSince >= 3 ? "text-destructive" : t.daysSince >= 1 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {t.daysSince}d
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 text-xs px-2"
                  disabled={sendingTo === t.id}
                  onClick={() => sendReminder(t)}
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingTo === t.id ? "Sending..." : "Remind"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OnboardingPipeline;
