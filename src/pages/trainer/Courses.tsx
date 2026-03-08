import { useState, useEffect } from "react";
import { Plus, BookOpen, Loader2, Edit, Eye, Users, Clock, IndianRupee, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TrainerLayout from "@/components/layouts/TrainerLayout";

interface CurriculumWeek {
  weekTitle: string;
  topics: string;
  learningOutcome: string;
  sessionCount: string;
}

const defaultForm = {
  title: "", description: "", duration_days: "30", total_sessions: "12",
  course_fee: "", language: "English", level: "beginner",
  session_duration_mins: "60", session_frequency: "3x/week",
  has_free_trial: true, what_you_learn: "", who_is_it_for: "",
};

const TrainerCourses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [curriculum, setCurriculum] = useState<CurriculumWeek[]>([
    { weekTitle: "", topics: "", learningOutcome: "", sessionCount: "3" },
  ]);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single();
      if (trainer) {
        setTrainerId(trainer.id);
        const { data } = await supabase.from("courses").select("*").eq("trainer_id", trainer.id).order("created_at", { ascending: false });
        setCourses(data || []);
      }
      setLoading(false);
    })();
  }, [user]);

  const openCreate = () => {
    setEditingCourse(null);
    setForm({ ...defaultForm });
    setCurriculum([{ weekTitle: "", topics: "", learningOutcome: "", sessionCount: "3" }]);
    setSheetOpen(true);
  };

  const openEdit = async (course: any) => {
    setEditingCourse(course);
    setForm({
      title: course.title || "",
      description: course.description || "",
      duration_days: String(course.duration_days || 30),
      total_sessions: String(course.total_sessions || 12),
      course_fee: String(course.course_fee || ""),
      language: course.language || "English",
      level: course.level || "beginner",
      session_duration_mins: String(course.session_duration_mins || 60),
      session_frequency: course.session_frequency || "3x/week",
      has_free_trial: course.has_free_trial ?? true,
      what_you_learn: (course.what_you_learn || []).join("\n"),
      who_is_it_for: course.who_is_it_for || "",
    });
    // Load curriculum
    const { data: weeks } = await supabase.from("course_curriculum").select("*").eq("course_id", course.id).order("week_number", { ascending: true });
    if (weeks && weeks.length > 0) {
      setCurriculum(weeks.map(w => ({
        weekTitle: w.week_title || "",
        topics: (w.topics || []).join(", "),
        learningOutcome: w.learning_outcome || "",
        sessionCount: String(w.session_count || 3),
      })));
    } else {
      setCurriculum([{ weekTitle: "", topics: "", learningOutcome: "", sessionCount: "3" }]);
    }
    setSheetOpen(true);
  };

  const addWeek = () => setCurriculum(prev => [...prev, { weekTitle: "", topics: "", learningOutcome: "", sessionCount: "3" }]);
  const removeWeek = (idx: number) => setCurriculum(prev => prev.filter((_, i) => i !== idx));
  const updateWeek = (idx: number, field: keyof CurriculumWeek, val: string) => {
    setCurriculum(prev => prev.map((w, i) => i === idx ? { ...w, [field]: val } : w));
  };
  const setField = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast({ title: "Course title is required", variant: "destructive" }); return; }
    if (!form.course_fee.trim() || parseFloat(form.course_fee) <= 0) { toast({ title: "Valid course fee is required", variant: "destructive" }); return; }
    if (!trainerId) { toast({ title: "Trainer profile not found", variant: "destructive" }); return; }

    setCreating(true);
    try {
      const courseData = {
        trainer_id: trainerId,
        title: form.title.trim(),
        description: form.description.trim(),
        duration_days: parseInt(form.duration_days),
        total_sessions: parseInt(form.total_sessions),
        course_fee: parseFloat(form.course_fee),
        language: form.language,
        level: form.level,
        session_duration_mins: parseInt(form.session_duration_mins),
        session_frequency: form.session_frequency,
        has_free_trial: form.has_free_trial,
        what_you_learn: form.what_you_learn.split("\n").map(l => l.trim()).filter(Boolean),
        who_is_it_for: form.who_is_it_for.trim(),
      };

      let courseId: string;

      if (editingCourse) {
        const { error } = await supabase.from("courses").update(courseData).eq("id", editingCourse.id);
        if (error) throw error;
        courseId = editingCourse.id;
        // Delete old curriculum
        await supabase.from("course_curriculum").delete().eq("course_id", courseId);
      } else {
        const { data: course, error } = await supabase.from("courses").insert(courseData).select().single();
        if (error) throw error;
        courseId = course.id;
      }

      // Insert curriculum
      const validWeeks = curriculum.filter(w => w.weekTitle.trim());
      if (validWeeks.length > 0) {
        const rows = validWeeks.map((w, i) => ({
          course_id: courseId,
          week_number: i + 1,
          week_title: w.weekTitle.trim(),
          topics: w.topics.split(",").map(t => t.trim()).filter(Boolean),
          learning_outcome: w.learningOutcome.trim(),
          session_count: parseInt(w.sessionCount) || 3,
        }));
        await supabase.from("course_curriculum").insert(rows);
      }

      toast({ title: editingCourse ? "Course updated!" : "Course created!", description: editingCourse ? "Changes saved." : "Your course is pending admin approval." });
      setSheetOpen(false);

      // Refresh
      const { data } = await supabase.from("courses").select("*").eq("trainer_id", trainerId).order("created_at", { ascending: false });
      setCourses(data || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const statusColor = (s: string) =>
    s === "approved" ? "bg-emerald-50 text-emerald-700" :
    s === "rejected" ? "bg-destructive/10 text-destructive" :
    "bg-amber-50 text-amber-700";

  return (
    <TrainerLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage your courses</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="w-4 h-4" /> Create Course
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 mt-6">{[1, 2].map(i => <div key={i} className="h-32 bg-card rounded-xl border animate-pulse" />)}</div>
      ) : courses.length === 0 ? (
        <div className="mt-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No courses yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Create your first course to start teaching</p>
          <Button onClick={openCreate} className="mt-4 gap-1.5"><Plus className="w-4 h-4" /> Create Course</Button>
        </div>
      ) : (
        <div className="grid gap-3 mt-6">
          {courses.map(c => (
            <div key={c.id} className="bg-card rounded-xl border p-5 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{c.title}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor(c.approval_status)}`}>
                      {c.approval_status}
                    </span>
                    {c.has_free_trial && <Badge variant="secondary" className="text-[10px]">Free Trial</Badge>}
                  </div>
                  {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration_days}d • {c.total_sessions} sessions</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.total_enrolled || 0} enrolled</span>
                    {c.average_rating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3" />{c.average_rating} ★</span>}
                    <span>{c.level} • {c.language}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-lg font-bold text-foreground">₹{c.course_fee?.toLocaleString("en-IN")}</p>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(c)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingCourse ? "Edit Course" : "Create New Course"}</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            {/* Basic Info */}
            <div>
              <Label>Course Title *</Label>
              <Input value={form.title} onChange={e => setField("title", e.target.value)} className="mt-1.5" placeholder="e.g. Full Stack Web Development" maxLength={100} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setField("description", e.target.value)} className="mt-1.5" placeholder="What students will learn..." rows={3} maxLength={1000} />
            </div>

            <Separator />

            {/* Course Structure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duration</Label>
                <Select value={form.duration_days} onValueChange={v => setField("duration_days", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="45">45 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Total Sessions</Label>
                <Input type="number" value={form.total_sessions} onChange={e => setField("total_sessions", e.target.value)} className="mt-1.5" min={1} max={100} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Session Duration</Label>
                <Select value={form.session_duration_mins} onValueChange={v => setField("session_duration_mins", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={form.session_frequency} onValueChange={v => setField("session_frequency", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="3x/week">3x / week</SelectItem>
                    <SelectItem value="2x/week">2x / week</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Pricing & Level */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Course Fee (₹) *</Label>
                <Input type="number" value={form.course_fee} onChange={e => setField("course_fee", e.target.value)} className="mt-1.5" placeholder="e.g. 14999" min={0} />
              </div>
              <div>
                <Label>Level</Label>
                <Select value={form.level} onValueChange={v => setField("level", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Language</Label>
                <Select value={form.language} onValueChange={v => setField("language", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Bengali", "Marathi"].map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.has_free_trial} onCheckedChange={v => setField("has_free_trial", v)} id="trial" />
                <Label htmlFor="trial" className="text-sm cursor-pointer">Free trial session</Label>
              </div>
            </div>

            <Separator />

            {/* What You'll Learn */}
            <div>
              <Label>What You'll Learn</Label>
              <Textarea value={form.what_you_learn} onChange={e => setField("what_you_learn", e.target.value)} className="mt-1.5" placeholder="One learning point per line, e.g.&#10;Build REST APIs&#10;Deploy to cloud" rows={3} />
              <p className="text-[11px] text-muted-foreground mt-1">One point per line</p>
            </div>
            <div>
              <Label>Who Is It For?</Label>
              <Input value={form.who_is_it_for} onChange={e => setField("who_is_it_for", e.target.value)} className="mt-1.5" placeholder="e.g. College students looking to enter tech" maxLength={200} />
            </div>

            <Separator />

            {/* Curriculum */}
            <div>
              <Label className="text-sm font-semibold">Weekly Curriculum (Optional)</Label>
              {curriculum.map((w, i) => (
                <div key={i} className="mt-3 p-3 rounded-lg bg-muted/50 border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">Week {i + 1}</p>
                    {curriculum.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeWeek(i)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <Input value={w.weekTitle} onChange={e => updateWeek(i, "weekTitle", e.target.value)} placeholder="Week title" className="h-8 text-sm" />
                  <Input value={w.topics} onChange={e => updateWeek(i, "topics", e.target.value)} placeholder="Topics (comma separated)" className="h-8 text-sm" />
                  <Input value={w.learningOutcome} onChange={e => updateWeek(i, "learningOutcome", e.target.value)} placeholder="Learning outcome" className="h-8 text-sm" />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addWeek} className="mt-2 text-xs">+ Add Week</Button>
            </div>

            <Button onClick={handleSubmit} disabled={creating || !form.title.trim() || !form.course_fee} className="w-full">
              {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{editingCourse ? "Saving..." : "Creating..."}</> : editingCourse ? "Save Changes" : "Create Course"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </TrainerLayout>
  );
};

export default TrainerCourses;
