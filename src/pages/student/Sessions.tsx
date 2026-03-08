import { useState, useEffect } from "react";
import { Calendar, Video, Clock, Star, RotateCcw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { useAuth } from "@/hooks/useAuth";
import StudentLayout from "@/components/layouts/StudentLayout";
import RatingModal from "@/components/RatingModal";
import SessionReflectionModal from "@/components/SessionReflectionModal";

const StudentSessions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [tab, setTab] = useState("upcoming");
  const [ratingModal, setRatingModal] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (!student) { setLoading(false); return; }

      const { data } = await supabase.from("course_sessions")
        .select("*, enrollments!inner(student_id, trainer_id, courses(title))")
        .eq("enrollments.student_id", student.id)
        .order("scheduled_at", { ascending: false });

      const sessData = data || [];
      const trainerIds = [...new Set(sessData.map(s => s.trainer_id))];
      if (trainerIds.length > 0) {
        const { data: trainers } = await supabase.from("trainers").select("id, user_id").in("id", trainerIds);
        const userIds = (trainers || []).map(t => t.user_id);
        const profileMap = await fetchProfilesMap(userIds);
        const nameMap: Record<string, string> = {};
        (trainers || []).forEach(t => { nameMap[t.id] = profileMap[t.user_id]?.full_name || "Trainer"; });
        setSessions(sessData.map(s => ({ ...s, trainerName: nameMap[s.trainer_id] || "Trainer" })));
      } else {
        setSessions(sessData);
      }

      // Check rated sessions
      const { data: ratings } = await supabase.from("ratings").select("session_id").eq("student_id", student.id).not("student_rated_at", "is", null);
      const ratedIds = new Set((ratings || []).map(r => r.session_id));
      setSessions(prev => prev.map(s => ({ ...s, isRated: ratedIds.has(s.id) })));
      setLoading(false);
    })();
  }, [user]);

  const filtered = sessions.filter(s => tab === "all" || s.status === tab);

  const isJoinable = (s: any) => {
    if (!s.scheduled_at || !s.meet_link) return false;
    const start = new Date(s.scheduled_at).getTime();
    const now = Date.now();
    return now >= start - 15 * 60 * 1000 && s.status === "upcoming";
  };

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold text-foreground">My Sessions</h1>
      <p className="mt-1 text-sm text-muted-foreground">View and manage your learning sessions</p>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">No {tab} sessions</p>
            <p className="text-xs text-muted-foreground mt-1">Sessions will appear once your trainer schedules them</p>
          </div>
        ) : filtered.map(s => (
          <div key={s.id} className="bg-card border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{s.title || s.enrollments?.courses?.title || `Session #${s.session_number}`}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    with {s.trainerName} • {s.duration_mins || 60} min
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Not scheduled"}
                  </p>
                  {s.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{s.notes}"</p>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                {isJoinable(s) && (
                  <a href={s.meet_link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="text-xs h-7 gap-1"><Video className="w-3 h-3" /> Join Now</Button>
                  </a>
                )}
                {s.status === "completed" && !s.isRated && (
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                    onClick={() => setRatingModal({
                      sessionId: s.id, enrollmentId: s.enrollment_id,
                      studentId: s.enrollments?.student_id, trainerId: s.trainer_id,
                    })}>
                    <Star className="w-3 h-3" /> Rate
                  </Button>
                )}
                {s.status === "completed" && s.isRated && (
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1"><Star className="w-3 h-3 fill-emerald-600" /> Rated</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {ratingModal && (
        <RatingModal
          type="student_rates_trainer"
          sessionId={ratingModal.sessionId}
          enrollmentId={ratingModal.enrollmentId}
          studentId={ratingModal.studentId}
          trainerId={ratingModal.trainerId}
          targetName="your trainer"
          onClose={() => setRatingModal(null)}
          onSubmitted={() => {
            setRatingModal(null);
            setSessions(prev => prev.map(s => s.id === ratingModal.sessionId ? { ...s, isRated: true } : s));
          }}
        />
      )}
    </StudentLayout>
  );
};

export default StudentSessions;
