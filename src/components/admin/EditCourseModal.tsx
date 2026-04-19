import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

interface EditCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: any;
  onSaved: (updated: any) => void;
}

const STATUS_OPTIONS = ["pending", "approved", "rejected", "changes_requested"];
const LEVEL_OPTIONS = ["beginner", "intermediate", "advanced", "all_levels"];

export const EditCourseModal = ({ open, onOpenChange, course, onSaved }: EditCourseModalProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title || "",
        description: course.description || "",
        course_fee: course.course_fee ?? 0,
        duration_days: course.duration_days ?? 0,
        total_sessions: course.total_sessions ?? 0,
        sessions_per_week: course.sessions_per_week ?? 0,
        session_duration_mins: course.session_duration_mins ?? 60,
        level: course.level || "beginner",
        language: course.language || "English",
        session_frequency: course.session_frequency || "",
        who_is_it_for: course.who_is_it_for || "",
        what_you_learn: Array.isArray(course.what_you_learn) ? [...course.what_you_learn] : [],
        has_free_trial: !!course.has_free_trial,
        free_trial_enabled: !!course.free_trial_enabled,
        is_active: course.is_active !== false,
        approval_status: course.approval_status || "pending",
        rejection_reason: course.rejection_reason || "",
        intro_video_url: course.intro_video_url || "",
        curriculum_pdf_url: course.curriculum_pdf_url || "",
        certification_url: course.certification_url || "",
      });
    }
  }, [course]);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const updateLearnItem = (i: number, v: string) => {
    const arr = [...(form.what_you_learn || [])];
    arr[i] = v;
    set("what_you_learn", arr);
  };
  const removeLearnItem = (i: number) => {
    const arr = [...(form.what_you_learn || [])];
    arr.splice(i, 1);
    set("what_you_learn", arr);
  };
  const addLearnItem = () => set("what_you_learn", [...(form.what_you_learn || []), ""]);

  const handleSave = async () => {
    if (!course?.id) return;
    if (!form.title?.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Per spec: admin edits auto-approve & activate
    const payload: any = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      course_fee: Number(form.course_fee) || 0,
      duration_days: Number(form.duration_days) || null,
      total_sessions: Number(form.total_sessions) || null,
      sessions_per_week: Number(form.sessions_per_week) || null,
      session_duration_mins: Number(form.session_duration_mins) || 60,
      level: form.level || null,
      language: form.language || null,
      session_frequency: form.session_frequency || null,
      who_is_it_for: form.who_is_it_for?.trim() || null,
      what_you_learn: (form.what_you_learn || []).filter((x: string) => x?.trim()),
      has_free_trial: !!form.has_free_trial,
      free_trial_enabled: !!form.free_trial_enabled,
      is_active: true,
      approval_status: "approved",
      rejection_reason: null,
      intro_video_url: form.intro_video_url?.trim() || null,
      curriculum_pdf_url: form.curriculum_pdf_url?.trim() || null,
      certification_url: form.certification_url?.trim() || null,
    };

    const { data, error } = await supabase
      .from("courses")
      .update(payload)
      .eq("id", course.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Edit course failed:", error);
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Sync trainer course_status & lifecycle
    if (course.trainer_id) {
      await supabase
        .from("trainers")
        .update({ course_status: "approved", trainer_status: "live" })
        .eq("id", course.trainer_id);
    }

    // Activity log
    supabase.from("admin_activity_log").insert({
      event_type: "course_edited",
      title: "Course Edited by Admin",
      description: `"${payload.title}" was edited and auto-approved`,
      metadata: { course_id: course.id, trainer_id: course.trainer_id },
    });

    toast({ title: "Course updated", description: "Changes saved and auto-approved." });
    onSaved({ ...course, ...data });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            All fields are editable. Saving will auto-approve and activate the course.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Basic */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Basic Info</h4>
            <div>
              <Label>Title</Label>
              <Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={3} value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div>
              <Label>Who is it for</Label>
              <Textarea rows={2} value={form.who_is_it_for || ""} onChange={(e) => set("who_is_it_for", e.target.value)} />
            </div>
          </div>

          <Separator />

          {/* Pricing & Schedule */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Pricing & Schedule</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Course Fee (₹)</Label>
                <Input type="number" min={0} value={form.course_fee} onChange={(e) => set("course_fee", e.target.value)} />
              </div>
              <div>
                <Label>Duration (days)</Label>
                <Input type="number" min={0} value={form.duration_days} onChange={(e) => set("duration_days", e.target.value)} />
              </div>
              <div>
                <Label>Total Sessions</Label>
                <Input type="number" min={0} value={form.total_sessions} onChange={(e) => set("total_sessions", e.target.value)} />
              </div>
              <div>
                <Label>Sessions / Week</Label>
                <Input type="number" min={0} value={form.sessions_per_week} onChange={(e) => set("sessions_per_week", e.target.value)} />
              </div>
              <div>
                <Label>Session Duration (mins)</Label>
                <Input type="number" min={0} value={form.session_duration_mins} onChange={(e) => set("session_duration_mins", e.target.value)} />
              </div>
              <div>
                <Label>Session Frequency</Label>
                <Input value={form.session_frequency || ""} onChange={(e) => set("session_frequency", e.target.value)} placeholder="e.g. Weekdays" />
              </div>
              <div>
                <Label>Level</Label>
                <Select value={form.level || "beginner"} onValueChange={(v) => set("level", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Language</Label>
                <Input value={form.language || ""} onChange={(e) => set("language", e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* What you'll learn */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">What You'll Learn</h4>
              <Button type="button" size="sm" variant="outline" onClick={addLearnItem}>
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>
            {(form.what_you_learn || []).length === 0 && (
              <p className="text-xs text-muted-foreground">No items yet.</p>
            )}
            {(form.what_you_learn || []).map((item: string, i: number) => (
              <div key={i} className="flex gap-2">
                <Input value={item} onChange={(e) => updateLearnItem(i, e.target.value)} />
                <Button type="button" size="icon" variant="ghost" onClick={() => removeLearnItem(i)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          {/* Trial & Status */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Trial & Visibility</h4>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Has Free Trial</p>
                <p className="text-xs text-muted-foreground">Show trial badge on course card.</p>
              </div>
              <Switch checked={!!form.has_free_trial} onCheckedChange={(v) => set("has_free_trial", v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Free Trial Bookings Enabled</p>
                <p className="text-xs text-muted-foreground">Allow students to book a free trial.</p>
              </div>
              <Switch checked={!!form.free_trial_enabled} onCheckedChange={(v) => set("free_trial_enabled", v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active (visible to students)</p>
                <p className="text-xs text-muted-foreground">Toggle off to hide without deleting.</p>
              </div>
              <Switch checked={!!form.is_active} onCheckedChange={(v) => set("is_active", v)} />
            </div>
          </div>

          <Separator />

          {/* Media */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Media URLs</h4>
            <div>
              <Label>Intro Video URL</Label>
              <Input value={form.intro_video_url || ""} onChange={(e) => set("intro_video_url", e.target.value)} />
            </div>
            <div>
              <Label>Curriculum PDF (path or URL)</Label>
              <Input value={form.curriculum_pdf_url || ""} onChange={(e) => set("curriculum_pdf_url", e.target.value)} />
            </div>
            <div>
              <Label>Certification URL</Label>
              <Input value={form.certification_url || ""} onChange={(e) => set("certification_url", e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save & Auto-approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCourseModal;
