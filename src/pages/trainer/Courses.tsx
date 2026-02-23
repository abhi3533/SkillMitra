import { useState, useEffect } from "react";
import { Plus, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

const TrainerCourses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", duration_days: "30", total_sessions: "12", course_fee: "", language: "English", level: "beginner" });
  const [curriculum, setCurriculum] = useState<CurriculumWeek[]>([
    { weekTitle: "", topics: "", learningOutcome: "", sessionCount: "3" },
  ]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single();
      if (trainer) {
        const { data } = await supabase.from("courses").select("*").eq("trainer_id", trainer.id).order("created_at", { ascending: false });
        setCourses(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const addWeek = () => setCurriculum(prev => [...prev, { weekTitle: "", topics: "", learningOutcome: "", sessionCount: "3" }]);

  const updateWeek = (idx: number, field: keyof CurriculumWeek, val: string) => {
    setCurriculum(prev => prev.map((w, i) => i === idx ? { ...w, [field]: val } : w));
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { toast({ title: "Course title is required", variant: "destructive" }); return; }
    if (!form.course_fee.trim() || parseFloat(form.course_fee) <= 0) { toast({ title: "Valid course fee is required", variant: "destructive" }); return; }

    setCreating(true);
    try {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user!.id).single();
      if (!trainer) throw new Error("Trainer profile not found");

      // Insert course
      const { data: course, error } = await supabase.from("courses").insert({
        trainer_id: trainer.id,
        title: form.title,
        description: form.description,
        duration_days: parseInt(form.duration_days),
        total_sessions: parseInt(form.total_sessions),
        course_fee: parseFloat(form.course_fee),
        language: form.language,
        level: form.level,
      }).select().single();
      if (error) throw error;

      // Insert curriculum weeks
      const validWeeks = curriculum.filter(w => w.weekTitle.trim());
      if (validWeeks.length > 0 && course) {
        const curriculumRows = validWeeks.map((w, i) => ({
          course_id: course.id,
          week_number: i + 1,
          week_title: w.weekTitle,
          topics: w.topics.split(",").map(t => t.trim()).filter(Boolean),
          learning_outcome: w.learningOutcome,
          session_count: parseInt(w.sessionCount) || 3,
        }));
        await supabase.from("course_curriculum").insert(curriculumRows);
      }

      toast({ title: "Course created!", description: "Your course is pending admin approval." });
      setOpen(false);
      setForm({ title: "", description: "", duration_days: "30", total_sessions: "12", course_fee: "", language: "English", level: "beginner" });
      setCurriculum([{ weekTitle: "", topics: "", learningOutcome: "", sessionCount: "3" }]);

      // Refresh
      const { data } = await supabase.from("courses").select("*").eq("trainer_id", trainer.id).order("created_at", { ascending: false });
      setCourses(data || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <TrainerLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
          <p className="mt-1 text-muted-foreground">Create and manage your courses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="hero-gradient border-0"><Plus className="w-4 h-4 mr-2" />Create Course</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create New Course</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Course Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1.5" placeholder="e.g. Full Stack Web Development" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1.5" placeholder="What students will learn..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Duration (days)</Label><Select value={form.duration_days} onValueChange={v => setForm(f => ({ ...f, duration_days: v }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="30">30 days</SelectItem><SelectItem value="45">45 days</SelectItem><SelectItem value="90">90 days</SelectItem></SelectContent></Select></div>
                <div><Label>Total Sessions</Label><Input type="number" value={form.total_sessions} onChange={e => setForm(f => ({ ...f, total_sessions: e.target.value }))} className="mt-1.5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Course Fee (₹) *</Label><Input type="number" value={form.course_fee} onChange={e => setForm(f => ({ ...f, course_fee: e.target.value }))} className="mt-1.5" placeholder="e.g. 14999" /></div>
                <div><Label>Level</Label><Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select></div>
              </div>

              {/* Curriculum */}
              <div className="border-t pt-4">
                <Label className="text-base font-semibold">Curriculum (Optional)</Label>
                {curriculum.map((w, i) => (
                  <div key={i} className="mt-3 p-3 rounded-lg bg-secondary/50 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Week {i + 1}</p>
                    <Input value={w.weekTitle} onChange={e => updateWeek(i, "weekTitle", e.target.value)} placeholder="Week title" className="h-9 text-sm" />
                    <Input value={w.topics} onChange={e => updateWeek(i, "topics", e.target.value)} placeholder="Topics (comma separated)" className="h-9 text-sm" />
                    <Input value={w.learningOutcome} onChange={e => updateWeek(i, "learningOutcome", e.target.value)} placeholder="Learning outcome" className="h-9 text-sm" />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addWeek} className="mt-2 text-xs">+ Add Week</Button>
              </div>

              <Button onClick={handleCreate} disabled={creating || !form.title || !form.course_fee} className="w-full hero-gradient border-0">
                {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Course"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 mt-6">{[1, 2].map(i => <div key={i} className="h-32 bg-card rounded-xl border animate-pulse" />)}</div>
      ) : courses.length === 0 ? (
        <div className="mt-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No courses yet</h3>
          <p className="mt-2 text-muted-foreground">Create your first course to start teaching</p>
        </div>
      ) : (
        <div className="grid gap-4 mt-6">
          {courses.map(c => (
            <div key={c.id} className="bg-card rounded-xl border p-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{c.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.approval_status === "approved" ? "bg-success/10 text-success" : c.approval_status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                    {c.approval_status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{c.duration_days} days • {c.total_sessions} sessions • {c.level}</p>
                <p className="text-sm text-muted-foreground">{c.total_enrolled} enrolled</p>
              </div>
              <p className="text-lg font-bold text-foreground">₹{c.course_fee?.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </TrainerLayout>
  );
};

export default TrainerCourses;
