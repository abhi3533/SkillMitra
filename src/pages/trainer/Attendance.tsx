import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, Users, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import TrainerLayout from "@/components/layouts/TrainerLayout";

const TrainerAttendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single();
      if (!trainer) { setLoading(false); return; }
      setTrainerId(trainer.id);

      const [coursesRes, sessionsRes] = await Promise.all([
        supabase.from("courses").select("id, title").eq("trainer_id", trainer.id),
        supabase.from("course_sessions").select("id, title, session_number, scheduled_at, status, enrollment_id").eq("trainer_id", trainer.id).order("scheduled_at", { ascending: false }),
      ]);
      setCourses(coursesRes.data || []);
      setSessions(sessionsRes.data || []);

      // Load attendance summary
      const { data: attData } = await supabase.from("attendance").select("status").eq("marked_by", trainer.id);
      const total = (attData || []).length;
      const present = (attData || []).filter(a => a.status === "present").length;
      setSummary({ total, present, absent: total - present });

      setLoading(false);
    })();
  }, [user]);

  const loadSessionAttendance = async (sessionId: string) => {
    if (!trainerId) return;
    setSelectedSession(sessionId);

    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    // Get enrollment and student for this session
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id, student_id, students(id, user_id)")
      .eq("id", session.enrollment_id)
      .single();

    if (!enrollment) return;

    const studentIds = [enrollment.student_id];
    const { data: studentRows } = await supabase.from("students").select("id, user_id").in("id", studentIds);
    const userIds = (studentRows || []).map(s => s.user_id);
    const profileMap = await fetchProfilesMap(userIds);

    const enriched = (studentRows || []).map(s => ({
      ...s,
      name: profileMap[s.user_id]?.full_name || "Student",
      email: profileMap[s.user_id]?.email || "",
      enrollmentId: enrollment.id,
    }));
    setStudents(enriched);

    // Load existing attendance
    const { data: attData } = await supabase
      .from("attendance")
      .select("*")
      .eq("session_id", sessionId);

    const attMap: Record<string, any> = {};
    (attData || []).forEach(a => { attMap[a.student_id] = a; });
    setAttendance(attMap);
  };

  const markAttendance = async (studentId: string, enrollmentId: string, status: "present" | "absent" | "excused") => {
    if (!trainerId || !selectedSession) return;
    setSaving(studentId);

    const existing = attendance[studentId];
    if (existing) {
      await supabase.from("attendance").update({ status, marked_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({
        session_id: selectedSession,
        student_id: studentId,
        enrollment_id: enrollmentId,
        status,
        marked_by: trainerId,
      });
    }

    setAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
    setSaving(null);
    toast({ title: `Marked as ${status}`, description: "Attendance updated successfully" });
  };

  const filteredSessions = selectedCourse === "all"
    ? sessions
    : sessions.filter(s => {
        // Filter by enrollment's course_id — we need to match via enrollment
        return true; // simplified: show all for now since sessions don't store course_id directly
      });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "text-emerald-600 bg-emerald-50";
      case "absent": return "text-destructive bg-destructive/10";
      case "excused": return "text-amber-600 bg-amber-50";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <TrainerLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">Mark and track student attendance for sessions</p>

        {/* Summary Cards */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-card rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{summary.total}</p>
              <p className="text-[11px] text-muted-foreground">Total Records</p>
            </div>
            <div className="bg-card rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{summary.present}</p>
              <p className="text-[11px] text-muted-foreground">Present</p>
            </div>
            <div className="bg-card rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{summary.absent}</p>
              <p className="text-[11px] text-muted-foreground">Absent</p>
            </div>
          </div>
        )}

        {/* Session List */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Select Session to Mark Attendance</h2>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-card rounded-xl border animate-pulse" />)}</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">No sessions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 20).map(s => (
                <button
                  key={s.id}
                  onClick={() => loadSessionAttendance(s.id)}
                  className={`w-full text-left bg-card border rounded-lg p-4 hover:border-primary/30 transition-colors ${
                    selectedSession === s.id ? "border-primary ring-1 ring-primary/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.title || `Session #${s.session_number}`}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not scheduled"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Marking */}
        {selectedSession && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Mark Attendance</h2>
            {students.length === 0 ? (
              <div className="text-center py-8 bg-card rounded-xl border">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No students found for this session</p>
              </div>
            ) : (
              <div className="space-y-2">
                {students.map(s => {
                  const att = attendance[s.id];
                  const currentStatus = att?.status || "unmarked";
                  return (
                    <div key={s.id} className="bg-card border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary text-xs font-bold">{s.name[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{s.name}</p>
                            <p className="text-[11px] text-muted-foreground">{s.email}</p>
                          </div>
                        </div>
                        {currentStatus !== "unmarked" && (
                          <Badge className={`text-[10px] ${getStatusColor(currentStatus)}`}>
                            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant={currentStatus === "present" ? "default" : "outline"}
                          className="text-xs gap-1 flex-1"
                          disabled={saving === s.id}
                          onClick={() => markAttendance(s.id, s.enrollmentId, "present")}
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Present
                        </Button>
                        <Button
                          size="sm"
                          variant={currentStatus === "absent" ? "destructive" : "outline"}
                          className="text-xs gap-1 flex-1"
                          disabled={saving === s.id}
                          onClick={() => markAttendance(s.id, s.enrollmentId, "absent")}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </Button>
                        <Button
                          size="sm"
                          variant={currentStatus === "excused" ? "secondary" : "outline"}
                          className="text-xs gap-1 flex-1"
                          disabled={saving === s.id}
                          onClick={() => markAttendance(s.id, s.enrollmentId, "excused")}
                        >
                          <AlertCircle className="w-3.5 h-3.5" /> Excused
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Certificate eligibility note */}
        <div className="mt-8 p-4 bg-muted/50 rounded-xl">
          <p className="text-xs font-semibold text-foreground mb-1">Attendance & Certificates</p>
          <p className="text-xs text-muted-foreground">Students need minimum 90% attendance to be eligible for course completion certificates.</p>
        </div>
      </div>
    </TrainerLayout>
  );
};

export default TrainerAttendance;
