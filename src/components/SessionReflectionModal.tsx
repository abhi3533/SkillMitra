import { useState } from "react";
import { Star, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  sessionId: string;
  studentId: string;
  sessionTitle: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const SessionReflectionModal = ({ sessionId, studentId, sessionTitle, onClose, onSubmitted }: Props) => {
  const [learnedToday, setLearnedToday] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [questions, setQuestions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!learnedToday.trim()) {
      toast({ title: "Please describe what you learned today", variant: "destructive" });
      return;
    }
    if (confidence === 0) {
      toast({ title: "Please rate your confidence level", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("session_reflections").insert({
      session_id: sessionId,
      student_id: studentId,
      learned_today: learnedToday.trim(),
      confidence_level: confidence,
      questions_for_next: questions.trim() || null,
    });

    if (error) {
      toast({ title: "Failed to save reflection", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reflection saved! 🎉" });
      onSubmitted();
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-foreground">Session Reflection 📝</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{sessionTitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* What did you learn */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">What did you learn today?</label>
            <Textarea
              placeholder="Share the key concepts, skills, or insights from this session..."
              value={learnedToday}
              onChange={e => setLearnedToday(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={1000}
            />
          </div>

          {/* Confidence Rating */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">How confident do you feel about this topic?</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(level => (
                <button key={level} onClick={() => setConfidence(level)} className="group">
                  <Star
                    className={`w-8 h-8 transition-colors ${level <= confidence ? "text-amber-400 fill-amber-400" : "text-border hover:text-amber-200"}`}
                  />
                </button>
              ))}
              <span className="text-sm text-muted-foreground ml-2">
                {confidence === 0 ? "" : confidence <= 2 ? "Need more practice" : confidence <= 3 ? "Getting there" : confidence <= 4 ? "Confident" : "Very confident!"}
              </span>
            </div>
          </div>

          {/* Questions for next session */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Questions for next session <span className="text-muted-foreground">(optional)</span></label>
            <Textarea
              placeholder="Any doubts or topics you'd like to cover next..."
              value={questions}
              onChange={e => setQuestions(e.target.value)}
              className="min-h-[70px] resize-none"
              maxLength={500}
            />
          </div>
        </div>

        <div className="p-5 border-t">
          <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
            <Send className="w-4 h-4" /> {submitting ? "Saving..." : "Submit Reflection"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionReflectionModal;
