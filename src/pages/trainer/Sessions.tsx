import { useState, useEffect } from "react";
import { Calendar, Clock, Video, ExternalLink, FileText, CheckCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  useEffect(() => {
    if (!user) return;
    (async () => {
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

      // Check attendance status for past sessions
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
    })();
  }, [user]);

  const saveNotes = async (sessionId: string) => {
    await supabase.from("course_sessions").update({ notes: noteText }).eq("id", sessionId);
    setTodaySessions(prev => prev.map(s => s.id === sessionId ? { ...s, notes: noteText } : s));
    setUpcomingSessions(prev => prev.map(s => s.id === sessionId ? { ...s, notes: noteText } : s));
    setPastSessions(prev => prev.map(s => s.id === sessionId ? { ...s, notes: noteText } : s));
    setEditingNotes(null);
    toast({ title: "Notes saved" });
  };

  const saveRecording = async (sessionId: string) => {
    await supabase.from("course_sessions").update({ recording_url: recordingUrl }).eq("id", sessionId);
    setPastSessions(prev => prev.map(s => s.id === sessionId ? { ...s, recording_url: recordingUrl } : s));
    setEditingRecording(null);
    toast({ title: "Recording URL saved" });
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
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {s.attendanceMarked && <Badge className="bg-emerald-50 text-emerald-700 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />Attended</Badge>}
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
        <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8" onClick={() => { setEditingNotes(s.id); setNoteText(s.notes || ""); }}>
          <FileText className="w-3.5 h-3.5" /> Notes
        </Button>
        {showRecording && (
          <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8" onClick={() => { setEditingRecording(s.id); setRecordingUrl(s.recording_url || ""); }}>
            <Upload className="w-3.5 h-3.5" /> Recording
          </Button>
        )}
      </div>
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
        <h1 className="text-2xl font-bold text-foreground">Sessions</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your teaching sessions</p>

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
                </div>
              ) : todaySessions.map(s => <SessionCard key={s.id} s={s} showJoin />)}
            </TabsContent>
            <TabsContent value="upcoming" className="mt-4 space-y-3">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border">
                  <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">No upcoming sessions</p>
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
    </TrainerLayout>
  );
};

export default TrainerSessions;
