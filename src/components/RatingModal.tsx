import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RatingModalProps {
  type: "student_rates_trainer" | "trainer_rates_student";
  sessionId: string;
  enrollmentId: string;
  studentId: string;
  trainerId: string;
  targetName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const StarInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} type="button" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => onChange(i)} className="transition-transform hover:scale-110">
            <Star className={`w-6 h-6 ${i <= (hover || value) ? "text-accent fill-accent" : "text-muted-foreground/30"}`} />
          </button>
        ))}
      </div>
    </div>
  );
};

const RatingModal = ({ type, sessionId, enrollmentId, studentId, trainerId, targetName, onClose, onSubmitted }: RatingModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isStudent = type === "student_rates_trainer";

  const [ratings, setRatings] = useState({
    overall: 0, teaching: 0, punctuality: 0, communication: 0,
    preparation: 0, engagement: 0,
  });
  const [reviewText, setReviewText] = useState("");

  const setR = (key: string, val: number) => setRatings(p => ({ ...p, [key]: val }));

  const canSubmit = isStudent
    ? ratings.overall > 0 && ratings.teaching > 0 && ratings.punctuality > 0 && ratings.communication > 0
    : ratings.punctuality > 0 && ratings.preparation > 0 && ratings.engagement > 0 && ratings.communication > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      // Check if rating already exists for this session
      const { data: existing } = await supabase.from("ratings").select("id").eq("session_id", sessionId).limit(1);
      
      const now = new Date().toISOString();
      
      if (existing && existing.length > 0) {
        // Update existing rating
        const updateData = isStudent ? {
          student_to_trainer_rating: ratings.overall,
          student_teaching_quality: ratings.teaching,
          student_punctuality_rating: ratings.punctuality,
          student_communication_rating: ratings.communication,
          student_review_text: reviewText || null,
          student_rated_at: now,
        } : {
          trainer_to_student_rating: Math.round((ratings.punctuality + ratings.preparation + ratings.engagement + ratings.communication) / 4),
          trainer_to_student_punctuality: ratings.punctuality,
          trainer_to_student_preparation: ratings.preparation,
          trainer_to_student_engagement: ratings.engagement,
          trainer_to_student_communication: ratings.communication,
          trainer_private_notes: reviewText || null,
          trainer_rated_at: now,
        };
        await supabase.from("ratings").update(updateData).eq("id", existing[0].id);
      } else {
        // Insert new rating
        const insertData: any = {
          session_id: sessionId,
          enrollment_id: enrollmentId,
          student_id: studentId,
          trainer_id: trainerId,
          ...(isStudent ? {
            student_to_trainer_rating: ratings.overall,
            student_teaching_quality: ratings.teaching,
            student_punctuality_rating: ratings.punctuality,
            student_communication_rating: ratings.communication,
            student_review_text: reviewText || null,
            student_rated_at: now,
          } : {
            trainer_to_student_rating: Math.round((ratings.punctuality + ratings.preparation + ratings.engagement + ratings.communication) / 4),
            trainer_to_student_punctuality: ratings.punctuality,
            trainer_to_student_preparation: ratings.preparation,
            trainer_to_student_engagement: ratings.engagement,
            trainer_to_student_communication: ratings.communication,
            trainer_private_notes: reviewText || null,
            trainer_rated_at: now,
          }),
        };
        await supabase.from("ratings").insert(insertData);
      }

      // If student rated, recalculate trainer average
      if (isStudent) {
        const { data: allRatings } = await supabase.from("ratings").select("student_to_trainer_rating").eq("trainer_id", trainerId).not("student_to_trainer_rating", "is", null);
        if (allRatings && allRatings.length > 0) {
          const avg = allRatings.reduce((s, r) => s + (r.student_to_trainer_rating || 0), 0) / allRatings.length;
          await supabase.from("trainers").update({ average_rating: Math.round(avg * 10) / 10 }).eq("id", trainerId);
        }
      }

      toast({ title: "Rating submitted!", description: "Thank you for your feedback." });
      onSubmitted();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
      <div className="bg-card rounded-xl border shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {isStudent ? `Rate ${targetName}` : `Rate Student: ${targetName}`}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-5">
          {isStudent ? (
            <>
              <StarInput label="Overall Experience" value={ratings.overall} onChange={v => setR("overall", v)} />
              <StarInput label="Teaching Quality" value={ratings.teaching} onChange={v => setR("teaching", v)} />
              <StarInput label="Punctuality" value={ratings.punctuality} onChange={v => setR("punctuality", v)} />
              <StarInput label="Communication" value={ratings.communication} onChange={v => setR("communication", v)} />
              <div>
                <label className="text-sm font-medium text-foreground">Review (optional, min 20 chars)</label>
                <Textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience..." className="mt-2" />
                {reviewText.length > 0 && reviewText.length < 20 && <p className="text-xs text-destructive mt-1">Minimum 20 characters</p>}
              </div>
            </>
          ) : (
            <>
              <StarInput label="Punctuality" value={ratings.punctuality} onChange={v => setR("punctuality", v)} />
              <StarInput label="Preparation" value={ratings.preparation} onChange={v => setR("preparation", v)} />
              <StarInput label="Engagement" value={ratings.engagement} onChange={v => setR("engagement", v)} />
              <StarInput label="Communication" value={ratings.communication} onChange={v => setR("communication", v)} />
              <div>
                <label className="text-sm font-medium text-foreground">Private Notes (admin only)</label>
                <Textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Notes about this student..." className="mt-2" />
              </div>
            </>
          )}
        </div>
        <div className="p-5 border-t border-border">
          <Button onClick={handleSubmit} disabled={!canSubmit || loading || (isStudent && reviewText.length > 0 && reviewText.length < 20)} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Rating
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
