import { useState, useEffect } from "react";
import { Award, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TrainerLayout from "@/components/layouts/TrainerLayout";

const TrainerCertificates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [scoreDialog, setScoreDialog] = useState<any>(null);
  const [scores, setScores] = useState({ technical: "80", communication: "80", punctuality: "85", comments: "" });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single();
      if (trainer) {
        const { data } = await supabase.from("enrollments")
          .select("*, students(*, profiles:user_id(full_name)), courses(title)")
          .eq("trainer_id", trainer.id)
          .eq("certificate_eligible", true);
        setEnrollments(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleApprove = async () => {
    if (!scoreDialog) return;
    const techScore = parseInt(scores.technical);
    const commScore = parseInt(scores.communication);
    const punctScore = parseInt(scores.punctuality);
    if (isNaN(techScore) || isNaN(commScore) || isNaN(punctScore)) {
      toast({ title: "Please enter valid scores", variant: "destructive" });
      return;
    }

    setApproving(scoreDialog.id);
    try {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user!.id).single();
      const overallScore = Math.round((techScore + commScore + punctScore) / 3);
      
      const { error } = await supabase.from("certificates").insert({
        student_id: scoreDialog.student_id,
        trainer_id: trainer!.id,
        enrollment_id: scoreDialog.id,
        course_name: scoreDialog.courses?.title,
        overall_score: overallScore,
        technical_score: techScore,
        communication_score: commScore,
        punctuality_score: punctScore,
        trainer_comments: scores.comments || null,
        trainer_approved: true,
      });
      if (error) throw error;

      toast({ title: "Certificate approved!", description: `Certificate ID generated. Student will be notified.` });
      setEnrollments(prev => prev.filter(e => e.id !== scoreDialog.id));
      setScoreDialog(null);
      setScores({ technical: "80", communication: "80", punctuality: "85", comments: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setApproving(null);
    }
  };

  return (
    <TrainerLayout>
      <h1 className="text-2xl font-bold text-foreground">Certificate Approval</h1>
      <p className="mt-1 text-muted-foreground">Review and approve student certificates</p>

      {loading ? (
        <div className="mt-6 space-y-4">{[1, 2].map(i => <div key={i} className="h-40 bg-card rounded-xl border animate-pulse" />)}</div>
      ) : enrollments.length === 0 ? (
        <div className="mt-12 text-center">
          <Award className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No pending certificates</h3>
          <p className="mt-2 text-muted-foreground">Students eligible for certificates will appear here</p>
        </div>
      ) : (
        <div className="grid gap-4 mt-6">
          {enrollments.map(e => (
            <div key={e.id} className="bg-card rounded-xl border p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{(e.students as any)?.profiles?.full_name || "Student"}</h3>
                  <p className="text-sm text-muted-foreground">{e.courses?.title}</p>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-lg font-bold text-foreground">{e.sessions_completed}/{e.sessions_total}</p><p className="text-xs text-muted-foreground">Sessions</p></div>
                    <div><p className="text-lg font-bold text-foreground">{e.progress_percent}%</p><p className="text-xs text-muted-foreground">Progress</p></div>
                    <div><p className="text-lg font-bold text-foreground">Eligible</p><p className="text-xs text-muted-foreground">Status</p></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setScoreDialog(e)} className="bg-success text-success-foreground border-0" size="sm">
                    <Check className="w-4 h-4 mr-1" />Approve
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Score Dialog */}
      <Dialog open={!!scoreDialog} onOpenChange={open => !open && setScoreDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Score & Approve Certificate</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Technical</Label><Input type="number" min="0" max="100" value={scores.technical} onChange={e => setScores(s => ({ ...s, technical: e.target.value }))} className="mt-1" /></div>
              <div><Label>Communication</Label><Input type="number" min="0" max="100" value={scores.communication} onChange={e => setScores(s => ({ ...s, communication: e.target.value }))} className="mt-1" /></div>
              <div><Label>Punctuality</Label><Input type="number" min="0" max="100" value={scores.punctuality} onChange={e => setScores(s => ({ ...s, punctuality: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label>Comments (Optional)</Label><Textarea value={scores.comments} onChange={e => setScores(s => ({ ...s, comments: e.target.value }))} className="mt-1" placeholder="Any feedback for the student..." /></div>
            <Button onClick={handleApprove} disabled={!!approving} className="w-full hero-gradient border-0">
              {approving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Approving...</> : "Approve & Generate Certificate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TrainerLayout>
  );
};

export default TrainerCertificates;
