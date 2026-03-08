import { useState, useEffect } from "react";
import { Calendar, Video, Clock, Star, MessageSquare, CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import StudentLayout from "@/components/layouts/StudentLayout";
import RatingModal from "@/components/RatingModal";
import SessionReflectionModal from "@/components/SessionReflectionModal";

const StudentSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [tab, setTab] = useState("upcoming");
  const [ratingModal, setRatingModal] = useState<any>(null);
  const [reflectionModal, setReflectionModal] = useState<any>(null);
  const [reflectedIds, setReflectedIds] = useState<Set<string>>(new Set());
  const [studentId, setStudentId] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Postpone state
  const [postponeModal, setPostponeModal] = useState<any>(null);
  const [postponeData, setPostponeData] = useState({ date: "", time: "", reason: "" });
  const [postponing, setPostponing] = useState(false);

  // Curriculum state
  const [curriculumMap, setCurriculumMap] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (!student) { setLoading(false); return; }
      setStudentId(student.id);

      const { data } = await supabase.from("course_sessions")
        .select("*, enrollments!inner(student_id, trainer_id, course_id, courses(title, total_sessions))")
        .eq("enrollments.student_id", student.id)
        .order("scheduled_at", { ascending: false });

      const sessData = data || [];
      const trainerIds = [...new Set(sessData.map(s => s.trainer_id))];
      let enriched = sessData;
      if (trainerIds.length > 0) {
        const { data: trainers } = await supabase.from("trainers").select("id, user_id").in("id", trainerIds);
        const userIds = (trainers || []).map(t => t.user_id);
        const profileMap = await fetchProfilesMap(userIds);
        const nameMap: Record<string, string> = {};
        (trainers || []).forEach(t => { nameMap[t.id] = profileMap[t.user_id]?.full_name || "Trainer"; });
        enriched = sessData.map(s => ({ ...s, trainerName: nameMap[s.trainer_id] || "Trainer" }));
      }

      // Check rated sessions
      const { data: ratings } = await supabase.from("ratings").select("session_id").eq("student_id", student.id).not("student_rated_at", "is", null);
      const ratedIds = new Set((ratings || []).map(r => r.session_id));
      enriched = enriched.map(s => ({ ...s, isRated: ratedIds.has(s.id) }));

      // Check reflected sessions
      const { data: refs } = await supabase.from("session_reflections").select("session_id").eq("student_id", student.id);
      setReflectedIds(new Set((refs || []).map(r => r.session_id)));

      setSessions(enriched);

      // Fetch curriculum for all enrolled courses
      const courseIds = [...new Set(sessData.map(s => s.enrollments?.course_id).filter(Boolean))];
      if (courseIds.length > 0) {
        const { data: currData } = await supabase.from("course_curriculum")
          .select("*")
          .in("course_id", courseIds)
          .order("week_number", { ascending: true });
        const cMap: Record<string, any[]> = {};
        (currData || []).forEach(c => {
          if (!cMap[c.course_id]) cMap[c.course_id] = [];
          cMap[c.course_id].push(c);
        });
        setCurriculumMap(cMap);
      }

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

  const handleJoin = async (s: any) => {
    if (!studentId) return;
    setJoiningId(s.id);
    try {
      // Mark joined_by_student and record join time
      await supabase.from("course_sessions").update({
        joined_by_student: true,
        student_join_time: new Date().toISOString(),
      }).eq("id", s.id);

      // Auto-create attendance record (present)
      const { data: existing } = await supabase.from("attendance")
        .select("id").eq("session_id", s.id).eq("student_id", studentId).limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("attendance").insert({
          session_id: s.id,
          student_id: studentId,
          enrollment_id: s.enrollment_id,
          status: "present",
          marked_by: s.trainer_id,
        });
      }

      // Open meet link
      window.open(s.meet_link, "_blank");
      setSessions(prev => prev.map(ss => ss.id === s.id ? { ...ss, joined_by_student: true } : ss));
    } catch (err: any) {
      toast({ title: "Error joining", description: err.message, variant: "destructive" });
    } finally {
      setJoiningId(null);
    }
  };

  const handlePostpone = async () => {
    if (!postponeData.date || !postponeData.time) {
      toast({ title: "Please select date and time", variant: "destructive" });
      return;
    }
    setPostponing(true);
    try {
      const newDate = new Date(`${postponeData.date}T${postponeData.time}`);
      await supabase.from("course_sessions").update({
        scheduled_at: newDate.toISOString(),
        notes: postponeModal.notes ? `${postponeModal.notes}\n[Rescheduled: ${postponeData.reason || "No reason given"}]` : `[Rescheduled: ${postponeData.reason || "No reason given"}]`,
      }).eq("id", postponeModal.id);

      // Notify trainer
      const { data: trainer } = await supabase.from("trainers").select("user_id").eq("id", postponeModal.trainer_id).single();
      if (trainer) {
        await supabase.from("notifications").insert({
          user_id: trainer.user_id,
          title: "Session Rescheduled",
          body: `A student has rescheduled a session to ${newDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} at ${postponeData.time}. Reason: ${postponeData.reason || "Not specified"}`,
          type: "session_rescheduled",
          action_url: "/trainer/sessions",
        });
      }

      setSessions(prev => prev.map(s => s.id === postponeModal.id ? { ...s, scheduled_at: newDate.toISOString() } : s));
      toast({ title: "Session rescheduled ✅", description: "Trainer has been notified." });
      setPostponeModal(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPostponing(false);
    }
  };

  // Get curriculum topic for a session based on session_number
  const getCurriculumTopic = (s: any) => {
    const courseId = s.enrollments?.course_id;
    if (!courseId || !curriculumMap[courseId]) return null;
    const curriculum = curriculumMap[courseId];
    const sessionNum = s.session_number || 0;
    let cumSessions = 0;
    for (const week of curriculum) {
      cumSessions += week.session_count || 1;
      if (sessionNum <= cumSessions) return week;
    }
    return null;
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
        ) : filtered.map(s => {
          const currTopic = getCurriculumTopic(s);
          return (
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
                    {currTopic && (
                      <p className="text-[11px] text-primary mt-1 flex items-center gap-1">
                        📚 Week {currTopic.week_number}: {currTopic.week_title}
                        {currTopic.topics?.length > 0 && ` — ${currTopic.topics.slice(0, 2).join(", ")}`}
                      </p>
                    )}
                    {s.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{s.notes}"</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                  {isJoinable(s) && (
                    <Button size="sm" className="text-xs h-7 gap-1" disabled={joiningId === s.id}
                      onClick={() => handleJoin(s)}>
                      {joiningId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Video className="w-3 h-3" />} Join Now
                    </Button>
                  )}
                  {s.status === "upcoming" && s.scheduled_at && (
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                      onClick={() => { setPostponeModal(s); setPostponeData({ date: "", time: "", reason: "" }); }}>
                      <CalendarClock className="w-3 h-3" /> Reschedule
                    </Button>
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
                  {s.status === "completed" && !reflectedIds.has(s.id) && (
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                      onClick={() => setReflectionModal({
                        sessionId: s.id,
                        studentId: s.enrollments?.student_id,
                        title: s.title || s.enrollments?.courses?.title || `Session #${s.session_number}`,
                      })}>
                      <MessageSquare className="w-3 h-3" /> Reflect
                    </Button>
                  )}
                  {s.status === "completed" && reflectedIds.has(s.id) && (
                    <span className="text-[10px] text-primary flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Reflected</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Postpone/Reschedule Dialog */}
      <Dialog open={!!postponeModal} onOpenChange={open => !open && setPostponeModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>New Date *</Label>
              <Input type="date" value={postponeData.date} onChange={e => setPostponeData(p => ({ ...p, date: e.target.value }))}
                className="mt-1.5" min={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <Label>New Time *</Label>
              <Input type="time" value={postponeData.time} onChange={e => setPostponeData(p => ({ ...p, time: e.target.value }))}
                className="mt-1.5" />
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea value={postponeData.reason} onChange={e => setPostponeData(p => ({ ...p, reason: e.target.value }))}
                className="mt-1.5" placeholder="Why do you need to reschedule?" rows={2} />
            </div>
            <Button onClick={handlePostpone} disabled={postponing} className="w-full">
              {postponing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Rescheduling...</> : "Confirm Reschedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {reflectionModal && (
        <SessionReflectionModal
          sessionId={reflectionModal.sessionId}
          studentId={reflectionModal.studentId}
          sessionTitle={reflectionModal.title}
          onClose={() => setReflectionModal(null)}
          onSubmitted={() => {
            setReflectedIds(prev => new Set([...prev, reflectionModal.sessionId]));
            setReflectionModal(null);
          }}
        />
      )}
    </StudentLayout>
  );
};

export default StudentSessions;
