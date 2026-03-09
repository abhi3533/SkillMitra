import { useState, useEffect } from "react";
import { Star, MessageSquare, Flag, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import TrainerLayout from "@/components/layouts/TrainerLayout";

const TrainerReviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [breakdown, setBreakdown] = useState<number[]>([0, 0, 0, 0, 0]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: trainer } = await supabase.from("trainers").select("id, average_rating").eq("user_id", user.id).single();
      if (!trainer) { setLoading(false); return; }

      setAvgRating(Number(trainer.average_rating) || 0);

      const { data: ratings } = await supabase.from("ratings").select("*").eq("trainer_id", trainer.id).not("student_to_trainer_rating", "is", null).order("student_rated_at", { ascending: false });

      const allRatings = ratings || [];

      // Breakdown
      const bd = [0, 0, 0, 0, 0];
      allRatings.forEach(r => { const v = r.student_to_trainer_rating; if (v >= 1 && v <= 5) bd[v - 1]++; });
      setBreakdown(bd);

      // Enrich with student names
      const sIds = [...new Set(allRatings.map(r => r.student_id))];
      let nameMap: Record<string, string> = {};
      if (sIds.length > 0) {
        const { data: studs } = await supabase.from("students").select("id, user_id").in("id", sIds);
        const uIds = (studs || []).map(s => s.user_id);
        const pMap = await fetchProfilesMap(uIds);
        (studs || []).forEach(s => { nameMap[s.id] = pMap[s.user_id]?.full_name || "Student"; });
      }

      setReviews(allRatings.map(r => ({ ...r, studentName: nameMap[r.student_id] || "Student" })));
      setLoading(false);
    })();
  }, [user]);

  const submitReply = async (ratingId: string) => {
    await supabase.from("ratings").update({ trainer_to_student_review: replyText, trainer_rated_at: new Date().toISOString() }).eq("id", ratingId);
    setReviews(prev => prev.map(r => r.id === ratingId ? { ...r, trainer_to_student_review: replyText } : r));
    setReplyingTo(null);
    setReplyText("");
    toast({ title: "Reply posted", variant: "success" });
  };

  const totalReviews = reviews.length;
  const maxBar = Math.max(...breakdown, 1);

  return (
    <TrainerLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">Reviews & Ratings</h1>
        <p className="text-sm text-muted-foreground mt-1">See what your students are saying</p>

        {loading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          </div>
        ) : (
          <>
            {/* Rating Overview */}
            <div className="mt-6 bg-card rounded-xl border p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="text-center sm:text-left">
                  <p className="text-5xl font-bold text-foreground">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-3">{star}</span>
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(breakdown[star - 1] / maxBar) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-6 text-right">{breakdown[star - 1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="mt-6 space-y-3">
              {reviews.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border">
                  <Star className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">No reviews yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Complete sessions to start receiving feedback</p>
                </div>
              ) : reviews.map(r => (
                <div key={r.id} className="bg-card border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-xs font-bold">{r.studentName[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.studentName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className={`w-3 h-3 ${i <= (r.student_to_trainer_rating || 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                          ))}
                          <span className="text-[11px] text-muted-foreground ml-1">
                            {r.student_rated_at ? new Date(r.student_rated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sub-ratings */}
                  {(r.student_teaching_quality || r.student_communication_rating || r.student_punctuality_rating) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {r.student_teaching_quality && <Badge variant="outline" className="text-[10px]">Teaching: {r.student_teaching_quality}/5</Badge>}
                      {r.student_communication_rating && <Badge variant="outline" className="text-[10px]">Communication: {r.student_communication_rating}/5</Badge>}
                      {r.student_punctuality_rating && <Badge variant="outline" className="text-[10px]">Punctuality: {r.student_punctuality_rating}/5</Badge>}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground mt-2">{r.student_to_trainer_review || r.student_review_text || "No written review"}</p>

                  {/* Trainer reply */}
                  {r.trainer_to_student_review && (
                    <div className="mt-3 bg-muted/50 rounded-lg p-3">
                      <p className="text-[11px] font-semibold text-foreground mb-1">Your Reply</p>
                      <p className="text-xs text-muted-foreground">{r.trainer_to_student_review}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    {!r.trainer_to_student_review && (
                      <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => { setReplyingTo(r.id); setReplyText(""); }}>
                        <MessageSquare className="w-3 h-3" /> Reply
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-xs gap-1 h-7 text-muted-foreground">
                      <Flag className="w-3 h-3" /> Flag
                    </Button>
                  </div>

                  {replyingTo === r.id && (
                    <div className="mt-3 space-y-2">
                      <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your reply..." className="text-xs min-h-[60px]" />
                      <div className="flex gap-2">
                        <Button size="sm" className="text-xs h-7" onClick={() => submitReply(r.id)} disabled={!replyText.trim()}>Post Reply</Button>
                        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setReplyingTo(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </TrainerLayout>
  );
};

export default TrainerReviews;
