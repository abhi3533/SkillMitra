import { useState, useEffect } from "react";
import { Calendar, Clock, Video, ExternalLink, FileText, CheckCircle, Upload, Plus, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import TrainerLayout from "@/components/layouts/TrainerLayout";

const TrainerSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [editingRecording, setEditingRecording] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [editingMeetLink, setEditingMeetLink] = useState<string | null>(null);
  const [meetLinkText, setMeetLinkText] = useState("");

  // New session sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [newSession, setNewSession] = useState({
    enrollmentId: "", title: "", date: "", time: "", durationMins: "60", meetLink: "", notes: "",
  });

  const fetchSessions = async () => {
    if (!user) return;
    const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single();
    if (!trainer) { setLoading(false); return; }
    setTrainerId(trainer.id);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { data: allSessions } = await supabase
      .from("course_sessions")
      .select("*, enrollments!inner(student_id, course_id, courses(title))")
      .eq("trainer_id", trainer.id)
      .order("scheduled_at", { ascending: true });

    const sessions = allSessions || [];

    // Get student names
    const studentIds = [...new Set(sessions.map(s => s.enrollments?.student_id).filter(Boolean))];
    let nameMap: Record<string, string> = {};
    if (studentIds.length > 0) {
      const { data: studs } = await supabase.from("students").select("id, user_id").in("id", studentIds);
      const uIds = (studs || []).map(s => s.user_id);
      const pMap = await fetchProfilesMap(uIds);
      (studs || []).forEach(s => { nameMap[s.id] = pMap[s.user_id]?.full_name || "Student"; });
    }

    // Check attendance
    const sessionIds = sessions.map(s => s.id);
    const { data: attData } = await supabase.from("attendance").select("session_id").in("session_id", sessionIds.length > 0 ? sessionIds : ["none"]);
    const attSet = new Set((attData || []).map(a => a.session_id));

    const enriched = sessions.map(s => ({
      ...s,
      studentName: nameMap[s.enrollments?.student_id] || "Student",
      courseName: s.enrollments?.courses?.title || "Course",
      attendanceMarked: attSet.has(s.id),
    }));

    const today: any[] = [];
    const upcoming: any[] = [];
    const past: any[] = [];

    enriched.forEach(s => {
      if (!s.scheduled_at) { upcoming.push(s); return; }
      const d = new Date(s.scheduled_at);
      if (s.scheduled_at >= todayStart && s.scheduled_at < todayEnd) today.push(s);
      else if (d > now) upcoming.push(s);
      else past.push(s);
    });

    setTodaySessions(today);
    setUpcomingSessions(upcoming);
    setPastSessions(past.reverse());
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, [user]);

  // Fetch enrollments for creating sessions
  const openCreateSheet = async () => {
    if (!trainerId) return;
    const { data } = await supabase
      .from("enrollments")
      .select("id, student_id, courses(title), students(id, user_id)")
      .eq("trainer_id", trainerId)
      .in("status", ["active", "trial"]);

    if (data && data.length > 0) {
      const studentIds = data.map(e => e.students?.user_id).filter(Boolean);
      const pMap = await fetchProfilesMap(studentIds as string[]);
      const enriched = data.map(e => ({
        ...e,
        studentName: pMap[e.students?.user_id || ""]?.full_name || "Student",
      }));
      setEnrollments(enriched);
    } else {
      setEnrollments([]);
    }
    setNewSession({ enrollmentId: "", title: "", date: "", time: "", durationMins: "60", meetLink: "", notes: "" });
    setSheetOpen(true);
  };

  const handleCreateSession = async () => {
    if (!newSession.enrollmentId || !newSession.date || !newSession.time) {
      toast({ title: "Please fill required fields", description: "Student, date and time are required.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const scheduledAt = new Date(`${newSession.date}T${newSession.time}`);
      
      // Get next session number for this enrollment
      const { count } = await supabase.from("course_sessions")
        .select("id", { count: "exact", head: true })
        .eq("enrollment_id", newSession.enrollmentId);

      const enrollment = enrollments.find(e => e.id === newSession.enrollmentId);

      const { error } = await supabase.from("course_sessions").insert({
        enrollment_id: newSession.enrollmentId,
        trainer_id: trainerId!,
        title: newSession.title || `${enrollment?.courses?.title || "Session"} — ${enrollment?.studentName || "Student"}`,
        scheduled_at: scheduledAt.toISOString(),
        duration_mins: parseInt(newSession.durationMins),
        meet_link: newSession.meetLink || null,
        notes: newSession.notes || null,
        session_number: (count || 0) + 1,
        status: "upcoming",
      });

      if (error) throw error;

      // Notify student
      if (enrollment?.students?.user_id) {
        await supabase.from("notifications").insert({
          user_id: enrollment.students.user_id,
          title: "New Session Scheduled",
          body: `Your trainer has scheduled a session on ${scheduledAt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} at ${newSession.time}`,
          type: "session_scheduled",
          action_url: "/student/sessions",
        });
      }

      toast({ title: "Session scheduled! ✅", description: "Student has been notified.", variant: "success" as any });
      setSheetOpen(false);
      await fetchSessions();
    } catch (err: any) {
      toast({ title: "Failed to create session", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const saveNotes = async (sessionId: string) => {
    await supabase.from("course_sessions").update({ notes: noteText }).eq("id", sessionId);
    const update = (list: any[]) => list.map(s => s.id === sessionId ? { ...s, notes: noteText } : s);
    setTodaySessions(update); setUpcomingSessions(update); setPastSessions(update);
    setEditingNotes(null);
    toast({ title: "Notes saved" });
  };

  const saveRecording = async (sessionId: string) => {
    await supabase.from("course_sessions").update({ recording_url: recordingUrl }).eq("id", sessionId);
    setPastSessions(prev => prev.map(s => s.id === sessionId ? { ...s, recording_url: recordingUrl } : s));
    setEditingRecording(null);
    toast({ title: "Recording URL saved" });
  };

  const saveMeetLink = async (sessionId: string) => {
    await supabase.from("course_sessions").update({ meet_link: meetLinkText }).eq("id", sessionId);
    const update = (list: any[]) => list.map(s => s.id === sessionId ? { ...s, meet_link: meetLinkText } : s);
    setTodaySessions(update); setUpcomingSessions(update); setPastSessions(update);
    setEditingMeetLink(null);
    toast({ title: "Meet link saved ✅" });
  };

  const canJoin = (scheduledAt: string | null) => {
    if (!scheduledAt) return false;
    const diff = new Date(scheduledAt).getTime() - Date.now();
    return diff <= 15 * 60 * 1000 && diff > -2 * 60 * 60 * 1000;
  };

  const SessionCard = ({ s, showJoin = false, showRecording = false }: { s: any; showJoin?: boolean; showRecording?: boolean }) => (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{s.title || s.courseName || `Session #${s.session_number}`}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{s.studentName} • {s.courseName}</p>
          <p className="text-[11px] text-muted-foreground">
            {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Not scheduled"}
          </p>
          {s.meet_link && (
            <p className="text-[10px] text-primary mt-0.5 flex items-center gap-1">
              <Link2 className="w-3 h-3" /> Meet link added
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {s.attendanceMarked && <Badge className="bg-emerald-50 text-emerald-700 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />Attended</Badge>}
          {s.is_trial && <Badge variant="secondary" className="text-[10px]">Trial</Badge>}
          <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {showJoin && s.meet_link && canJoin(s.scheduled_at) && (
          <a href={s.meet_link} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="text-xs gap-1.5 h-8"><Video className="w-3.5 h-3.5" /> Join Now</Button>
          </a>
        )}
        {showJoin && s.meet_link && !canJoin(s.scheduled_at) && (
          <a href={s.meet_link} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8"><ExternalLink className="w-3.5 h-3.5" /> Meet Link</Button>
          </a>
        )}
        {!s.meet_link && s.status === "upcoming" && (
          <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8 border-primary/30 text-primary" onClick={() => { setEditingMeetLink(s.id); setMeetLinkText(""); }}>
            <Video className="w-3.5 h-3.5" /> Add Meet Link
          </Button>
        )}
        <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8" onClick={() => { setEditingNotes(s.id); setNoteText(s.notes || ""); }}>
          <FileText className="w-3.5 h-3.5" /> Notes
        </Button>
        {showRecording && (
          <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8" onClick={() => { setEditingRecording(s.id); setRecordingUrl(s.recording_url || ""); }}>
            <Upload className="w-3.5 h-3.5" /> Recording
          </Button>
        )}
      </div>

      {/* Inline meet link editor */}
      {editingMeetLink === s.id && (
        <div className="mt-3 space-y-2">
          <Input value={meetLinkText} onChange={e => setMeetLinkText(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" className="text-xs h-8" />
          <div className="flex gap-2">
            <Button size="sm" className="text-xs h-7" onClick={() => saveMeetLink(s.id)} disabled={!meetLinkText.trim()}>Save</Button>
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setEditingMeetLink(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {editingNotes === s.id && (
        <div className="mt-3 space-y-2">
          <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Session notes..." className="text-xs min-h-[60px]" />
          <div className="flex gap-2">
            <Button size="sm" className="text-xs h-7" onClick={() => saveNotes(s.id)}>Save</Button>
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setEditingNotes(null)}>Cancel</Button>
          </div>
        </div>
      )}
      {editingRecording === s.id && (
        <div className="mt-3 space-y-2">
          <Input value={recordingUrl} onChange={e => setRecordingUrl(e.target.value)} placeholder="https://drive.google.com/..." className="text-xs h-8" />
          <div className="flex gap-2">
            <Button size="sm" className="text-xs h-7" onClick={() => saveRecording(s.id)}>Save</Button>
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setEditingRecording(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <TrainerLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sessions</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your teaching sessions</p>
          </div>
          <Button onClick={openCreateSheet} className="gap-1.5">
            <Plus className="w-4 h-4" /> Schedule Session
          </Button>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : (
          <Tabs defaultValue="today" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today" className="text-xs">Today ({todaySessions.length})</TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs">Upcoming ({upcomingSessions.length})</TabsTrigger>
              <TabsTrigger value="past" className="text-xs">Past ({pastSessions.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="today" className="mt-4 space-y-3">
              {todaySessions.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border">
                  <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">No sessions today ☀️</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={openCreateSheet}>Schedule a session</Button>
                </div>
              ) : todaySessions.map(s => <SessionCard key={s.id} s={s} showJoin />)}
            </TabsContent>
            <TabsContent value="upcoming" className="mt-4 space-y-3">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border">
                  <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">No upcoming sessions</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={openCreateSheet}>Schedule a session</Button>
                </div>
              ) : upcomingSessions.slice(0, 20).map(s => <SessionCard key={s.id} s={s} showJoin />)}
            </TabsContent>
            <TabsContent value="past" className="mt-4 space-y-3">
              {pastSessions.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border">
                  <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">No past sessions</p>
                </div>
              ) : pastSessions.slice(0, 20).map(s => <SessionCard key={s.id} s={s} showRecording />)}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Create Session Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Schedule New Session</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            {enrollments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No enrolled students yet</p>
                <p className="text-xs text-muted-foreground mt-1">Students need to enroll or book a trial first.</p>
              </div>
            ) : (
              <>
                <div>
                  <Label>Student & Course *</Label>
                  <Select value={newSession.enrollmentId} onValueChange={v => setNewSession(p => ({ ...p, enrollmentId: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {enrollments.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.studentName} — {e.courses?.title || "Course"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Session Title</Label>
                  <Input value={newSession.title} onChange={e => setNewSession(p => ({ ...p, title: e.target.value }))}
                    className="mt-1.5" placeholder="e.g. Week 2: React Hooks" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date *</Label>
                    <Input type="date" value={newSession.date} onChange={e => setNewSession(p => ({ ...p, date: e.target.value }))}
                      className="mt-1.5" min={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div>
                    <Label>Time *</Label>
                    <Input type="time" value={newSession.time} onChange={e => setNewSession(p => ({ ...p, time: e.target.value }))}
                      className="mt-1.5" />
                  </div>
                </div>

                <div>
                  <Label>Duration</Label>
                  <Select value={newSession.durationMins} onValueChange={v => setNewSession(p => ({ ...p, durationMins: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Google Meet Link</Label>
                  <Input value={newSession.meetLink} onChange={e => setNewSession(p => ({ ...p, meetLink: e.target.value }))}
                    className="mt-1.5" placeholder="https://meet.google.com/abc-defg-hij" />
                  <p className="text-[11px] text-muted-foreground mt-1">You can add this later too</p>
                </div>

                <div>
                  <Label>Notes for student</Label>
                  <Textarea value={newSession.notes} onChange={e => setNewSession(p => ({ ...p, notes: e.target.value }))}
                    className="mt-1.5" placeholder="Topics to cover, preparation needed..." rows={2} />
                </div>

                <Button onClick={handleCreateSession} disabled={creating} className="w-full">
                  {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scheduling...</> : "Schedule Session"}
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </TrainerLayout>
  );
};

export default TrainerSessions;
