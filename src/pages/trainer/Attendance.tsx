import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, Users, Calendar, FileText, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0 });
  const [courseSummaries, setCourseSummaries] = useState<Record<string, { total: number; present: number }>>({});
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single();
      if (!trainer) { setLoading(false); return; }
      setTrainerId(trainer.id);

      const [coursesRes, sessionsRes, attRes] = await Promise.all([
        supabase.from("courses").select("id, title").eq("trainer_id", trainer.id),
        supabase.from("course_sessions").select("id, title, session_number, scheduled_at, status, enrollment_id").eq("trainer_id", trainer.id).order("scheduled_at", { ascending: false }),
        supabase.from("attendance").select("*, course_sessions!inner(enrollment_id, enrollments!inner(course_id))").eq("marked_by", trainer.id).order("marked_at", { ascending: false }).limit(50),
      ]);
      setCourses(coursesRes.data || []);
      setSessions(sessionsRes.data || []);

      const allAtt = attRes.data || [];
      const total = allAtt.length;
      const present = allAtt.filter((a: any) => a.status === "present").length;
      setSummary({ total, present, absent: total - present });

      // Course-level summaries
      const cSums: Record<string, { total: number; present: number }> = {};
      allAtt.forEach((a: any) => {
        const cid = a.course_sessions?.enrollments?.course_id;
        if (!cid) return;
        if (!cSums[cid]) cSums[cid] = { total: 0, present: 0 };
        cSums[cid].total++;
        if (a.status === "present") cSums[cid].present++;
      });
      setCourseSummaries(cSums);

      // Enrich history with student names
      if (allAtt.length > 0) {
        const sIds = [...new Set(allAtt.map((a: any) => a.student_id))];
        const { data: studs } = await supabase.from("students").select("id, user_id").in("id", sIds);
        const uIds = (studs || []).map(s => s.user_id);
        const pMap = await fetchProfilesMap(uIds);
        const nMap: Record<string, string> = {};
        (studs || []).forEach(s => { nMap[s.id] = pMap[s.user_id]?.full_name || "Student"; });
        setHistory(allAtt.map((a: any) => ({ ...a, studentName: nMap[a.student_id] || "Student" })));
      }

      setLoading(false);
    })();
  }, [user]);

  const loadSessionAttendance = async (sessionId: string) => {
    if (!trainerId) return;
    setSelectedSession(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const { data: enrollment } = await supabase.from("enrollments").select("id, student_id").eq("id", session.enrollment_id).single();
    if (!enrollment) return;

    const { data: studentRows } = await supabase.from("students").select("id, user_id").in("id", [enrollment.student_id]);
    const userIds = (studentRows || []).map(s => s.user_id);
    const profileMap = await fetchProfilesMap(userIds);

    const enriched = (studentRows || []).map(s => ({
      ...s,
      name: profileMap[s.user_id]?.full_name || "Student",
      email: profileMap[s.user_id]?.email || "",
      enrollmentId: enrollment.id,
    }));
    setStudents(enriched);

    const { data: attData } = await supabase.from("attendance").select("*").eq("session_id", sessionId);
    const attMap: Record<string, any> = {};
    const noteMap: Record<string, string> = {};
    (attData || []).forEach(a => { attMap[a.student_id] = a; noteMap[a.student_id] = a.notes || ""; });
    setAttendance(attMap);
    setNotes(noteMap);
  };

  const markAttendance = async (studentId: string, enrollmentId: string, status: "present" | "absent" | "excused") => {
    if (!trainerId || !selectedSession) return;
    setSaving(studentId);
    const existing = attendance[studentId];
    const noteText = notes[studentId] || null;
    if (existing) {
      await supabase.from("attendance").update({ status, notes: noteText, marked_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({ session_id: selectedSession, student_id: studentId, enrollment_id: enrollmentId, status, marked_by: trainerId, notes: noteText });
    }
    setAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
    setSaving(null);
    toast({ title: `Marked as ${status}`, variant: "success" });
  };

  const bulkMarkPresent = async () => {
    if (!trainerId || !selectedSession) return;
    setSaving("bulk");
    for (const s of students) {
      const existing = attendance[s.id];
      if (existing) {
        await supabase.from("attendance").update({ status: "present", marked_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabase.from("attendance").insert({ session_id: selectedSession, student_id: s.id, enrollment_id: s.enrollmentId, status: "present", marked_by: trainerId });
      }
      setAttendance(prev => ({ ...prev, [s.id]: { ...prev[s.id], status: "present" } }));
    }
    setSaving(null);
    toast({ title: "All marked present", variant: "success" });
  };

  const filteredSessions = selectedCourse === "all" ? sessions : sessions;

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = { present: "bg-emerald-50 text-emerald-700", absent: "bg-destructive/10 text-destructive", excused: "bg-amber-50 text-amber-700" };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  return (
    <TrainerLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">Mark and track student attendance for sessions</p>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3 mt-6">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : (
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

        {/* Course-level attendance summary */}
        {!loading && courses.length > 0 && (
          <div className="mt-6 bg-card rounded-xl border p-5">
            <h2 className="text-base font-semibold text-foreground mb-3">Attendance by Course</h2>
            <div className="space-y-2">
              {courses.map(c => {
                const cs = courseSummaries[c.id];
                const pct = cs ? Math.round((cs.present / cs.total) * 100) : 0;
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium text-foreground">{c.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{cs?.present || 0}/{cs?.total || 0}</span>
                      <Badge className={`text-[10px] ${pct >= 90 ? "bg-emerald-50 text-emerald-700" : pct >= 75 ? "bg-amber-50 text-amber-700" : "bg-destructive/10 text-destructive"}`}>
                        {pct}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Course Filter + Session List */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Select Session</h2>
            {courses.length > 1 && (
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">No sessions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSessions.slice(0, 20).map(s => (
                <button key={s.id} onClick={() => loadSessionAttendance(s.id)}
                  className={`w-full text-left bg-card border rounded-lg p-4 hover:border-primary/30 transition-colors ${selectedSession === s.id ? "border-primary ring-1 ring-primary/20" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.title || `Session #${s.session_number}`}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {s.scheduled_at ? formatDateTimeIST(s.scheduled_at) : "Not scheduled"}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Mark Attendance</h2>
              {students.length > 1 && (
                <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={bulkMarkPresent} disabled={saving === "bulk"}>
                  <CheckCheck className="w-3.5 h-3.5" /> Mark All Present
                </Button>
              )}
            </div>
            {students.length === 0 ? (
              <div className="text-center py-8 bg-card rounded-xl border">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No students found for this session</p>
              </div>
            ) : (
              <div className="space-y-3">
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
                          <Badge className={`text-[10px] ${getStatusBadge(currentStatus)}`}>{currentStatus}</Badge>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant={currentStatus === "present" ? "default" : "outline"} className="text-xs gap-1 flex-1" disabled={saving === s.id} onClick={() => markAttendance(s.id, s.enrollmentId, "present")}>
                          <CheckCircle className="w-3.5 h-3.5" /> Present
                        </Button>
                        <Button size="sm" variant={currentStatus === "absent" ? "destructive" : "outline"} className="text-xs gap-1 flex-1" disabled={saving === s.id} onClick={() => markAttendance(s.id, s.enrollmentId, "absent")}>
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </Button>
                        <Button size="sm" variant={currentStatus === "excused" ? "secondary" : "outline"} className="text-xs gap-1 flex-1" disabled={saving === s.id} onClick={() => markAttendance(s.id, s.enrollmentId, "excused")}>
                          <AlertCircle className="w-3.5 h-3.5" /> Excused
                        </Button>
                      </div>
                      <Textarea placeholder="Session notes (optional)" className="mt-3 text-xs min-h-[60px]" value={notes[s.id] || ""} onChange={e => setNotes(prev => ({ ...prev, [s.id]: e.target.value }))} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Attendance History */}
        {!loading && history.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Attendance History</h2>
            <div className="space-y-2">
              {history.slice(0, 15).map(h => (
                <div key={h.id} className="bg-card border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.studentName}</p>
                    <p className="text-[11px] text-muted-foreground">{h.marked_at ? formatDateTimeIST(h.marked_at) : ""}</p>
                  </div>
                  <Badge className={`text-[10px] ${getStatusBadge(h.status)}`}>{h.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-muted/50 rounded-xl">
          <p className="text-xs font-semibold text-foreground mb-1">Attendance & Certificates</p>
          <p className="text-xs text-muted-foreground">Students need minimum 90% attendance to be eligible for course completion certificates.</p>
        </div>
      </div>
    </TrainerLayout>
  );
};

export default TrainerAttendance;
