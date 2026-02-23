import { useState, useEffect } from "react";
import { Award, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TrainerLayout from "@/components/layouts/TrainerLayout";

const TrainerCertificates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single();
      if (trainer) {
        const { data } = await supabase.from("enrollments")
          .select("*, students(*, profiles(full_name)), courses(title)")
          .eq("trainer_id", trainer.id)
          .eq("certificate_eligible", true);
        setEnrollments(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const approveCertificate = async (enrollment: any) => {
    try {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user!.id).single();
      const { error } = await supabase.from("certificates").insert({
        student_id: enrollment.student_id, trainer_id: trainer!.id,
        enrollment_id: enrollment.id, course_name: enrollment.courses?.title,
        overall_score: 85, technical_score: 80, communication_score: 85,
        punctuality_score: 90, trainer_approved: true,
      });
      if (error) throw error;
      toast({ title: "Certificate approved!", description: "Student will be notified." });
      setEnrollments(prev => prev.filter(e => e.id !== enrollment.id));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
                  <h3 className="font-semibold text-foreground">{e.students?.profiles?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{e.courses?.title}</p>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-lg font-bold text-foreground">{e.sessions_completed}/{e.sessions_total}</p><p className="text-xs text-muted-foreground">Sessions</p></div>
                    <div><p className="text-lg font-bold text-foreground">{e.progress_percent}%</p><p className="text-xs text-muted-foreground">Progress</p></div>
                    <div><p className="text-lg font-bold text-foreground">Eligible</p><p className="text-xs text-muted-foreground">Status</p></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => approveCertificate(e)} className="bg-success text-success-foreground border-0" size="sm">
                    <Check className="w-4 h-4 mr-1" />Approve
                  </Button>
                  <Button variant="outline" size="sm"><X className="w-4 h-4 mr-1" />Reject</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </TrainerLayout>
  );
};

export default TrainerCertificates;
