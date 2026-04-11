import { useState, useEffect } from "react";
import { Plus, BookOpen, Loader2, Edit, Eye, Users, Clock, IndianRupee, Star, Trash2, Lock, AlertCircle } from "lucide-react";
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
import RequestCourseUpdateModal from "@/components/trainer/RequestCourseUpdateModal";

interface CurriculumWeek {
  weekTitle: string;
  topics: string;
  learningOutcome: string;
  sessionCount: string;
}

const PRESET_DURATIONS = ["30", "45", "90"];
const PRESET_SESSION_DURATIONS = ["30", "45", "60", "90"];
const PRESET_FREQUENCIES = ["daily", "3x/week", "2x/week", "weekly"];
const PRESET_LANGUAGES = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Bengali", "Marathi"];

const defaultForm = {
  title: "", description: "", duration_days: "30", total_sessions: "13",
  course_fee: "", language: "English", level: "beginner",
  session_duration_mins: "60", session_frequency: "3x/week",
  has_free_trial: true, what_you_learn: "", who_is_it_for: "",
  custom_duration: "", custom_session_duration: "", custom_frequency: "", custom_language: "",
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
  const [profileApproved, setProfileApproved] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateModalCourse, setUpdateModalCourse] = useState<string>("");

  // Whether the course being edited is approved (locked)
  const isApprovedCourse = editingCourse?.approval_status === "approved";

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: trainer } = await supabase.from("trainers").select("id, approval_status").eq("user_id", user.id).maybeSingle();
      if (trainer) {
        setTrainerId(trainer.id);
        setApprovalStatus(trainer.approval_status);
        setProfileApproved(trainer.approval_status === "approved");
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
    const durationVal = String(course.duration_days || 30);
    const sessionDurVal = String(course.session_duration_mins || 60);
    const freqVal = course.session_frequency || "3x/week";
    const langVal = course.language || "English";

    setForm({
      title: course.title || "",
      description: course.description || "",
      duration_days: PRESET_DURATIONS.includes(durationVal) ? durationVal : "custom",
      total_sessions: String(course.total_sessions || 12),
      course_fee: String(course.course_fee || ""),
      language: PRESET_LANGUAGES.includes(langVal) ? langVal : "other",
      level: course.level || "beginner",
      session_duration_mins: PRESET_SESSION_DURATIONS.includes(sessionDurVal) ? sessionDurVal : "custom",
      session_frequency: PRESET_FREQUENCIES.includes(freqVal) ? freqVal : "custom",
      has_free_trial: course.has_free_trial ?? true,
      what_you_learn: (course.what_you_learn || []).join("\n"),
      who_is_it_for: course.who_is_it_for || "",
      custom_duration: PRESET_DURATIONS.includes(durationVal) ? "" : durationVal,
      custom_session_duration: PRESET_SESSION_DURATIONS.includes(sessionDurVal) ? "" : sessionDurVal,
      custom_frequency: PRESET_FREQUENCIES.includes(freqVal) ? "" : freqVal,
      custom_language: PRESET_LANGUAGES.includes(langVal) ? "" : langVal,
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
  // Calculate total sessions excluding weekends based on duration & frequency
  const calculateSessions = (durationDays: string, customDuration: string, frequency: string): string | null => {
    const days = durationDays === "custom" ? parseInt(customDuration) : parseInt(durationDays);
    if (!days || days < 1) return null;

    // Count weekdays in the duration
    let weekdays = 0;
    const start = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const day = d.getDay();
      if (day !== 0 && day !== 6) weekdays++;
    }

    let sessionsPerWeek: number;
    switch (frequency) {
      case "daily": return String(weekdays); // weekdays only
      case "3x/week": sessionsPerWeek = 3; break;
      case "2x/week": sessionsPerWeek = 2; break;
      case "weekly": sessionsPerWeek = 1; break;
      default: return null; // custom frequency, can't auto-calc
    }

    const weeks = Math.ceil(days / 7);
    return String(Math.min(weeks * sessionsPerWeek, weekdays));
  };

  const setField = (field: string, value: any) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      // Auto-calculate total_sessions when duration or frequency changes
      if (["duration_days", "custom_duration", "session_frequency"].includes(field)) {
        const calc = calculateSessions(updated.duration_days, updated.custom_duration, updated.session_frequency);
        if (calc) updated.total_sessions = calc;
      }
      return updated;
    });
  };

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Course title is required";
    else if (form.title.trim().length < 10) errors.title = "Title must be at least 10 characters";
    else if (form.title.trim().length > 100) errors.title = "Title must be under 100 characters";

    if (!form.description.trim()) errors.description = "Description is required";
    else if (form.description.trim().length < 100) errors.description = "Description must be at least 100 characters";
    else if (form.description.trim().length > 1000) errors.description = "Description must be under 1000 characters";

    if (!form.course_fee.trim()) errors.course_fee = "Course fee is required";
    else if (parseFloat(form.course_fee) < 500) errors.course_fee = "Minimum course fee is ₹500";
    else if (parseFloat(form.course_fee) > 500000) errors.course_fee = "Maximum course fee is ₹5,00,000";

    if (!form.what_you_learn.trim()) errors.what_you_learn = "At least one learning point is required";
    if (!form.who_is_it_for.trim()) errors.who_is_it_for = "Target audience is required";
    else if (form.who_is_it_for.trim().length < 10) errors.who_is_it_for = "Please describe the target audience (min 10 chars)";
    else if (form.who_is_it_for.trim().length > 200) errors.who_is_it_for = "Must be under 200 characters";

    if (form.duration_days === "custom" && (!form.custom_duration || parseInt(form.custom_duration) < 1 || parseInt(form.custom_duration) > 365)) {
      errors.duration_days = "Duration must be between 1 and 365 days";
    }
    if (form.session_duration_mins === "custom" && (!form.custom_session_duration || parseInt(form.custom_session_duration) < 15 || parseInt(form.custom_session_duration) > 180)) {
      errors.session_duration_mins = "Session duration must be between 15 and 180 minutes";
    }
    if (form.session_frequency === "custom" && !form.custom_frequency.trim()) {
      errors.session_frequency = "Please specify the frequency";
    }
    if (form.language === "other" && !form.custom_language.trim()) {
      errors.language = "Please specify the language";
    }

    return errors;
  };

  const handleSubmit = async () => {
    if (!isApprovedCourse) {
      const errors = validateForm();
      setValidationErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast({ title: "Please fix all errors", description: "Some required fields are missing or invalid.", variant: "warning" });
        return;
      }
    }
    if (!trainerId) { toast({ title: "Trainer profile not found", variant: "warning" }); return; }

    setCreating(true);
    try {
      const resolvedDuration = form.duration_days === "custom" ? parseInt(form.custom_duration) : parseInt(form.duration_days);
      const resolvedSessionDur = form.session_duration_mins === "custom" ? parseInt(form.custom_session_duration) : parseInt(form.session_duration_mins);
      const resolvedFrequency = form.session_frequency === "custom" ? form.custom_frequency.trim() : form.session_frequency;
      const resolvedLanguage = form.language === "other" ? form.custom_language.trim() : form.language;

      if (!resolvedDuration || resolvedDuration < 1 || resolvedDuration > 365) { toast({ title: "Duration must be between 1 and 365 days", variant: "warning" }); setCreating(false); return; }
      if (!resolvedSessionDur || resolvedSessionDur < 15 || resolvedSessionDur > 180) { toast({ title: "Session duration must be between 15 and 180 minutes", variant: "warning" }); setCreating(false); return; }
      if (!resolvedFrequency) { toast({ title: "Frequency is required", variant: "warning" }); setCreating(false); return; }
      if (!resolvedLanguage) { toast({ title: "Language is required", variant: "warning" }); setCreating(false); return; }

      // For approved courses, only save editable fields
      if (isApprovedCourse) {
        const editableData = {
          has_free_trial: form.has_free_trial,
          session_frequency: resolvedFrequency,
        };
        const { error } = await supabase.from("courses").update(editableData).eq("id", editingCourse.id);
        if (error) throw error;

        toast({ title: "Course updated!", description: "Editable fields saved.", variant: "success" });
        setSheetOpen(false);
        const { data } = await supabase.from("courses").select("*").eq("trainer_id", trainerId).order("created_at", { ascending: false });
        setCourses(data || []);
        setCreating(false);
        return;
      }

      const courseData = {
        trainer_id: trainerId,
        title: form.title.trim(),
        description: form.description.trim(),
        duration_days: resolvedDuration,
        total_sessions: parseInt(form.total_sessions),
        course_fee: parseFloat(form.course_fee),
        language: resolvedLanguage,
        level: form.level,
        session_duration_mins: resolvedSessionDur,
        session_frequency: resolvedFrequency,
        has_free_trial: form.has_free_trial,
        what_you_learn: form.what_you_learn.split("\n").map(l => l.trim()).filter(Boolean),
        who_is_it_for: form.who_is_it_for.trim(),
      };

      let courseId: string;

      if (editingCourse) {
        // If the course was rejected or had changes requested, reset it to "pending"
        // so the admin queue picks it up for re-review.
        const needsReview = ["rejected", "changes_requested"].includes(editingCourse.approval_status);
        const updateData = needsReview ? { ...courseData, approval_status: "pending" } : courseData;
        const { error } = await supabase.from("courses").update(updateData).eq("id", editingCourse.id);
        if (error) throw error;
        courseId = editingCourse.id;
        // Delete old curriculum
        await supabase.from("course_curriculum").delete().eq("course_id", courseId);
      } else {
        const { data: course, error } = await supabase.from("courses").insert(courseData).select().single();
        if (error) throw error;
        courseId = course.id;

        // Update trainer course_status to 'pending' after new course submission
        await supabase.from("trainers").update({ course_status: "pending" }).eq("id", trainerId);

        // Fetch trainer profile for notification emails
        const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user?.id).maybeSingle();

        // Trigger course submission notification (fire-and-forget)
        supabase.functions.invoke("notify-course-submitted", {
          body: {
            trainer_name: profile?.full_name || "",
            trainer_email: profile?.email || user?.email || "",
            course_title: form.title.trim(),
            course_fee: form.course_fee,
            duration_days: courseData.duration_days,
            total_sessions: courseData.total_sessions,
          },
        }).catch(err => console.error("Course notification error:", err));
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

      toast({ title: editingCourse ? "Course updated!" : "Course submitted!", description: editingCourse ? "Changes saved." : "Your new course has been submitted for admin review. You will be notified once approved.", variant: "success" });
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
    s === "changes_requested" ? "bg-orange-50 text-orange-700" :
    "bg-amber-50 text-amber-700";

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return { text: "Course is under admin review. To request changes email contact@skillmitra.online", color: "border-amber-200 bg-amber-50 text-amber-800" };
      case "changes_requested":
        return { text: "Admin requested changes. Please update and resubmit.", color: "border-orange-200 bg-orange-50 text-orange-800" };
      case "rejected":
        return { text: "Course was rejected. Please update and resubmit.", color: "border-destructive/30 bg-destructive/5 text-destructive" };
      default:
        return null;
    }
  };

  return (
    <TrainerLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage your courses</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5" disabled={!profileApproved} title={!profileApproved ? "Profile approval required to create a course" : undefined}>
          <Plus className="w-4 h-4" /> Create Course
        </Button>
      </div>

      {!loading && approvalStatus && approvalStatus !== "approved" && (
        <div className={`mt-4 rounded-lg border p-4 text-sm ${
          approvalStatus === "pending" || approvalStatus === "submitted"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-border bg-muted/50 text-muted-foreground"
        }`}>
          {approvalStatus === "pending" || approvalStatus === "submitted"
            ? "⏳ Your profile is currently under review by admin. You can create a course once approved."
            : "⚠️ Please complete and submit your profile first before creating a course."}
        </div>
      )}
      {!loading && profileApproved && courses.length === 0 && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          🚀 Create your first course to go live on SkillMitra!
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 mt-6">{[1, 2].map(i => <div key={i} className="h-32 bg-card rounded-xl border animate-pulse" />)}</div>
      ) : courses.length === 0 ? (
        <div className="mt-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No Courses Yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Create your first course to start training students.</p>
          <Button onClick={openCreate} className="mt-4 gap-1.5" disabled={!profileApproved}><Plus className="w-4 h-4" /> Create Course</Button>
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
                      {c.approval_status === "changes_requested" ? "changes requested" : c.approval_status}
                    </span>
                    {c.approval_status === "approved" && <Lock className="w-3 h-3 text-muted-foreground" />}
                    {c.has_free_trial && <Badge variant="secondary" className="text-[10px]">Free Trial</Badge>}
                  </div>
                  {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration_days} days • {c.total_sessions} sessions • {Math.round(((c.total_sessions || 0) * (c.session_duration_mins || 60)) / 60)} hrs total</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.total_enrolled || 0} enrolled</span>
                    {c.average_rating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3" />{c.average_rating} ★</span>}
                    <span>{c.level} • {c.language}</span>
                  </div>
                  {getStatusMessage(c.approval_status) && (
                    <p className={`mt-2 text-xs px-3 py-1.5 rounded-md border ${getStatusMessage(c.approval_status)!.color}`}>
                      {getStatusMessage(c.approval_status)!.text}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-lg font-bold text-foreground">₹{c.course_fee?.toLocaleString("en-IN")}</p>
                  {c.approval_status !== "pending" && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(c)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
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
            {/* Approved course lock banner */}
            {isApprovedCourse && (
              <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">Course locked after approval</p>
                  <p className="text-xs text-amber-700 mt-0.5">Key fields are read-only. Click "Request Update" below to request changes from admin.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={() => {
                      setUpdateModalCourse(editingCourse?.title || "");
                      setUpdateModalOpen(true);
                    }}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Request Course Update
                  </Button>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div>
              <Label>Course Title *</Label>
              <Input value={form.title} onChange={e => { setField("title", e.target.value); setValidationErrors(prev => ({ ...prev, title: "" })); }} className="mt-1.5" placeholder="e.g. Full Stack Web Development" maxLength={100} disabled={isApprovedCourse} />
              <p className="text-[11px] text-muted-foreground mt-1">A clear, descriptive title for your course (10–100 characters). {form.title.length}/100</p>
              {validationErrors.title && <p className="text-[11px] text-destructive mt-0.5">{validationErrors.title}</p>}
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={e => { setField("description", e.target.value); setValidationErrors(prev => ({ ...prev, description: "" })); }} className="mt-1.5" placeholder="Describe what students will learn, course structure, and outcomes..." rows={4} maxLength={1000} disabled={isApprovedCourse} />
              <p className="text-[11px] text-muted-foreground mt-1">Detailed course description covering topics, outcomes & structure (100–1000 characters). {form.description.length}/1000</p>
              {validationErrors.description && <p className="text-[11px] text-destructive mt-0.5">{validationErrors.description}</p>}
            </div>

            <Separator />

            {/* Course Structure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duration *</Label>
                <Select value={form.duration_days} onValueChange={v => { setField("duration_days", v); setValidationErrors(prev => ({ ...prev, duration_days: "" })); }} disabled={isApprovedCourse}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="45">45 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {form.duration_days === "custom" && (
                  <Input type="number" value={form.custom_duration} onChange={e => { setField("custom_duration", e.target.value); setValidationErrors(prev => ({ ...prev, duration_days: "" })); }} className="mt-1.5" placeholder="Days (1-365)" min={1} max={365} disabled={isApprovedCourse} />
                )}
                <p className="text-[11px] text-muted-foreground mt-1">Total course duration in days</p>
                {validationErrors.duration_days && <p className="text-[11px] text-destructive mt-0.5">{validationErrors.duration_days}</p>}
              </div>
              <div>
                <Label>Total Sessions <span className="text-xs text-muted-foreground font-normal">(auto-calculated)</span></Label>
                <Input type="number" value={form.total_sessions} onChange={e => setField("total_sessions", e.target.value)} className="mt-1.5" min={1} max={365} disabled={isApprovedCourse} />
                <p className="text-[11px] text-muted-foreground mt-1">Auto-calculated excluding weekends</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Session Duration *</Label>
                <Select value={form.session_duration_mins} onValueChange={v => { setField("session_duration_mins", v); setValidationErrors(prev => ({ ...prev, session_duration_mins: "" })); }} disabled={isApprovedCourse}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {form.session_duration_mins === "custom" && (
                  <Input type="number" value={form.custom_session_duration} onChange={e => { setField("custom_session_duration", e.target.value); setValidationErrors(prev => ({ ...prev, session_duration_mins: "" })); }} className="mt-1.5" placeholder="Minutes (15-180)" min={15} max={180} disabled={isApprovedCourse} />
                )}
                <p className="text-[11px] text-muted-foreground mt-1">Duration of each session (15–180 min)</p>
                {validationErrors.session_duration_mins && <p className="text-[11px] text-destructive mt-0.5">{validationErrors.session_duration_mins}</p>}
              </div>
              <div>
                <Label>Frequency *</Label>
                <Select value={form.session_frequency} onValueChange={v => { setField("session_frequency", v); setValidationErrors(prev => ({ ...prev, session_frequency: "" })); }}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="3x/week">3x / week</SelectItem>
                    <SelectItem value="2x/week">2x / week</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {form.session_frequency === "custom" && (
                  <Input value={form.custom_frequency} onChange={e => { setField("custom_frequency", e.target.value); setValidationErrors(prev => ({ ...prev, session_frequency: "" })); }} className="mt-1.5" placeholder="e.g. 4x/week, Weekends only" maxLength={50} />
                )}
                <p className="text-[11px] text-muted-foreground mt-1">How often sessions happen per week</p>
                {validationErrors.session_frequency && <p className="text-[11px] text-destructive mt-0.5">{validationErrors.session_frequency}</p>}
              </div>
            </div>

            <Separator />

            {/* Pricing & Level */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Course Fee (₹) *</Label>
                <Input type="number" value={form.course_fee} onChange={e => { setField("course_fee", e.target.value); setValidationErrors(prev => ({ ...prev, course_fee: "" })); }} className="mt-1.5" placeholder="e.g. 14999" min={500} max={500000} disabled={isApprovedCourse} />
                <p className="text-[11px] text-muted-foreground mt-1">Total course fee in INR (₹500 – ₹5,00,000)</p>
                {validationErrors.course_fee && <p className="text-[11px] text-destructive mt-0.5">{validationErrors.course_fee}</p>}
              </div>
              <div>
                <Label>Level *</Label>
                <Select value={form.level} onValueChange={v => setField("level", v)} disabled={isApprovedCourse}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">Skill level required for this course</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Language *</Label>
                <Select value={form.language} onValueChange={v => { setField("language", v); setValidationErrors(prev => ({ ...prev, language: "" })); }} disabled={isApprovedCourse}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRESET_LANGUAGES.map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.language === "other" && (
                  <Input value={form.custom_language} onChange={e => { setField("custom_language", e.target.value); setValidationErrors(prev => ({ ...prev, language: "" })); }} className="mt-1.5" placeholder="Enter language" maxLength={50} />
                )}
                <p className="text-[11px] text-muted-foreground mt-1">Primary language of instruction</p>
                {validationErrors.language && <p className="text-[11px] text-destructive mt-0.5">{validationErrors.language}</p>}
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.has_free_trial} onCheckedChange={v => setField("has_free_trial", v)} id="trial" />
                <Label htmlFor="trial" className="text-sm cursor-pointer">Free trial session</Label>
              </div>
            </div>

            <Separator />

            {/* What You'll Learn */}
            <div>
              <Label>What You'll Learn *</Label>
              <Textarea value={form.what_you_learn} onChange={e => { setField("what_you_learn", e.target.value); setValidationErrors(prev => ({ ...prev, what_you_learn: "" })); }} className="mt-1.5" placeholder="One learning point per line, e.g.&#10;Build REST APIs&#10;Deploy to cloud&#10;Master React fundamentals" rows={4} disabled={isApprovedCourse} />
              <p className="text-[11px] text-muted-foreground mt-1">List key skills students will gain — one per line (minimum 1 point)</p>
              {validationErrors.what_you_learn && <p className="text-[11px] text-destructive mt-0.5">{validationErrors.what_you_learn}</p>}
            </div>
            <div>
              <Label>Who Is It For? *</Label>
              <Input value={form.who_is_it_for} onChange={e => { setField("who_is_it_for", e.target.value); setValidationErrors(prev => ({ ...prev, who_is_it_for: "" })); }} className="mt-1.5" placeholder="e.g. College students looking to enter tech" maxLength={200} disabled={isApprovedCourse} />
              <p className="text-[11px] text-muted-foreground mt-1">Describe your target audience (10–200 characters). {form.who_is_it_for.length}/200</p>
              {validationErrors.who_is_it_for && <p className="text-[11px] text-destructive mt-0.5">{validationErrors.who_is_it_for}</p>}
            </div>

            <Separator />

            {/* Curriculum */}
            <div>
              <Label className="text-sm font-semibold">Weekly Curriculum (Optional)</Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">Add a week-by-week breakdown of what you'll cover. Helps students understand the course structure.</p>
              {curriculum.map((w, i) => (
                <div key={i} className="mt-3 p-3 rounded-lg bg-muted/50 border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">Week {i + 1}</p>
                    {curriculum.length > 1 && !isApprovedCourse && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeWeek(i)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <Input value={w.weekTitle} onChange={e => updateWeek(i, "weekTitle", e.target.value)} placeholder="Week title, e.g. Introduction & Setup" className="h-8 text-sm" disabled={isApprovedCourse} />
                  <Input value={w.topics} onChange={e => updateWeek(i, "topics", e.target.value)} placeholder="Topics (comma separated), e.g. HTML, CSS, JS basics" className="h-8 text-sm" disabled={isApprovedCourse} />
                  <Input value={w.learningOutcome} onChange={e => updateWeek(i, "learningOutcome", e.target.value)} placeholder="Learning outcome, e.g. Build a basic webpage" className="h-8 text-sm" disabled={isApprovedCourse} />
                </div>
              ))}
              {!isApprovedCourse && (
                <Button variant="outline" size="sm" onClick={addWeek} className="mt-2 text-xs">+ Add Week</Button>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={creating} className="w-full">
              {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{editingCourse ? "Saving..." : "Creating..."}</> : editingCourse ? "Save Changes" : "Create Course"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Request Course Update Modal */}
      <RequestCourseUpdateModal
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        courseTitle={updateModalCourse}
      />
    </TrainerLayout>
  );
};

export default TrainerCourses;
