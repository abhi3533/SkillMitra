import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { useAuth } from "@/hooks/useAuth";
import TrainerLayout from "@/components/layouts/TrainerLayout";
import { Calendar, Video, Clock, ArrowRight, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TrainerSchedule = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [curriculumMap, setCurriculumMap] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single();
      if (!trainer) { setLoading(false); return; }

      const now = new Date();
      const { data } = await supabase
        .from("course_sessions")
        .select("*, enrollments!inner(student_id, course_id, courses(title))")
        .eq("trainer_id", trainer.id)
        .eq("status", "upcoming")
        .gte("scheduled_at", now.toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(30);

      const sessData = data || [];
      if (sessData.length > 0) {
        const studentIds = [...new Set(sessData.map(s => s.enrollments?.student_id).filter(Boolean))];
        const { data: studs } = await supabase.from("students").select("id, user_id").in("id", studentIds);
        const uIds = (studs || []).map(s => s.user_id);
        const pMap = await fetchProfilesMap(uIds);
        const nameMap: Record<string, string> = {};
        (studs || []).forEach(s => { nameMap[s.id] = pMap[s.user_id]?.full_name || "Student"; });
        setSessions(sessData.map(s => ({ ...s, studentName: nameMap[s.enrollments?.student_id] || "Student", courseName: s.enrollments?.courses?.title || "Course" })));

        // Fetch curriculum
        const courseIds = [...new Set(sessData.map(s => s.enrollments?.course_id).filter(Boolean))];
        if (courseIds.length > 0) {
          const { data: currData } = await supabase.from("course_curriculum")
            .select("*").in("course_id", courseIds).order("week_number", { ascending: true });
          const cMap: Record<string, any[]> = {};
          (currData || []).forEach(c => {
            if (!cMap[c.course_id]) cMap[c.course_id] = [];
            cMap[c.course_id].push(c);
          });
          setCurriculumMap(cMap);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  // Group sessions by date
  const grouped: Record<string, any[]> = {};
  sessions.forEach(s => {
    if (!s.scheduled_at) return;
    const dateKey = getDateGroupKeyIST(s.scheduled_at);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(s);
  });

  const canJoin = (scheduledAt: string) => {
    const diff = new Date(scheduledAt).getTime() - Date.now();
    return diff <= 15 * 60 * 1000 && diff > -2 * 60 * 60 * 1000;
  };

  const handleJoin = async (s: any) => {
    setJoiningId(s.id);
    try {
      await supabase.from("course_sessions").update({
        joined_by_trainer: true,
        trainer_join_time: new Date().toISOString(),
      }).eq("id", s.id);
      window.open(s.meet_link, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setJoiningId(null);
    }
  };

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
    <TrainerLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
            <p className="text-sm text-muted-foreground mt-1">Your upcoming sessions at a glance</p>
          </div>
          <Link to="/trainer/sessions">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              All Sessions <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-card rounded-xl border animate-pulse" />)}</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border">
              <Calendar className="w-14 h-14 text-muted-foreground/20 mx-auto" />
              <p className="text-muted-foreground mt-3">No upcoming sessions</p>
              <p className="text-xs text-muted-foreground mt-1">Schedule sessions from the Sessions page</p>
              <Link to="/trainer/sessions">
                <Button className="mt-4 gap-1.5" size="sm">Go to Sessions <ArrowRight className="w-3.5 h-3.5" /></Button>
              </Link>
            </div>
          ) : (
            Object.entries(grouped).map(([date, dateSessions]) => (
              <div key={date} className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> {date}
                </h3>
                <div className="space-y-2 ml-6 border-l-2 border-primary/10 pl-4">
                  {dateSessions.map(s => {
                    const currTopic = getCurriculumTopic(s);
                    return (
                      <div key={s.id} className="bg-card rounded-lg border p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{s.title || `Session #${s.session_number}`}</p>
                          <p className="text-[11px] text-muted-foreground">{s.studentName} • {s.courseName}</p>
                          {currTopic && (
                            <p className="text-[11px] text-primary mt-0.5">
                              📚 Week {currTopic.week_number}: {currTopic.week_title}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(s.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              {" · "}{s.duration_mins || 60} min
                            </span>
                            {s.meet_link && <span className="text-[10px] text-primary flex items-center gap-0.5"><Link2 className="w-3 h-3" />Meet</span>}
                            {s.is_trial && <Badge variant="secondary" className="text-[9px] h-4">Trial</Badge>}
                          </div>
                        </div>
                        {s.meet_link && canJoin(s.scheduled_at) && (
                          <Button size="sm" className="text-xs h-8 gap-1" disabled={joiningId === s.id}
                            onClick={() => handleJoin(s)}>
                            {joiningId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />} Join
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </TrainerLayout>
  );
};

export default TrainerSchedule;
