import { useState, useEffect } from "react";
import { formatDateIST, formatLongDateIST } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import EditCourseModal from "@/components/admin/EditCourseModal";
import { BookOpen, Check, X, Eye, Search, RefreshCw, Clock, Users, IndianRupee, Calendar, Star, MessageSquare, Pencil, Trash2 } from "lucide-react";

interface CourseWithTrainer {
  id: string;
  title: string;
  description: string | null;
  course_fee: number;
  duration_days: number | null;
  total_sessions: number | null;
  session_duration_mins: number | null;
  level: string | null;
  language: string | null;
  has_free_trial: boolean | null;
  session_frequency: string | null;
  total_enrolled: number | null;
  what_you_learn: string[] | null;
  who_is_it_for: string | null;
  approval_status: string | null;
  is_active: boolean | null;
  created_at: string;
  trainer_id: string;
  trainerName: string;
  trainerEmail: string;
  rejection_reason: string | null;
  sessions_per_week: number | null;
  free_trial_enabled: boolean | null;
  weekly_curriculum: any | null;
  intro_video_url: string | null;
  
  curriculum_pdf_url: string | null;
  certification_url: string | null;
  verification_selfie_url: string | null;
}

const AdminCourses = () => {
  const [courses, setCourses] = useState<CourseWithTrainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<CourseWithTrainer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);

  const [signedCourseUrls, setSignedCourseUrls] = useState<Record<string, string>>({});

  const resolveAdminCourseUrl = async (pathOrUrl: string, bucket: string): Promise<string> => {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith("http")) return pathOrUrl;
    const { data } = await supabase.storage.from(bucket).createSignedUrl(pathOrUrl, 3600);
    return data?.signedUrl || "";
  };

  // Comment modal state
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentAction, setCommentAction] = useState<"rejected" | "changes_requested">("rejected");
  const [commentText, setCommentText] = useState("");
  const [commentCourseId, setCommentCourseId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Edit & delete state
  const [editOpen, setEditOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<CourseWithTrainer | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState<CourseWithTrainer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { toast } = useToast();

  const openEdit = (course: CourseWithTrainer) => {
    setEditCourse(course);
    setEditOpen(true);
  };

  const handleEditSaved = (updated: any) => {
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    if (selectedCourse?.id === updated.id) setSelectedCourse((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  const openDelete = (course: CourseWithTrainer) => {
    setDeleteCourse(course);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteCourse) return;
    setDeleting(true);
    // Best-effort: clear curriculum first (no FK cascade guarantee)
    await supabase.from("course_curriculum").delete().eq("course_id", deleteCourse.id);
    const { error } = await supabase.from("courses").delete().eq("id", deleteCourse.id);
    if (error) {
      console.error("Delete course failed:", error);
      toast({
        title: "Delete failed",
        description: error.message.includes("violates foreign key")
          ? "This course has enrollments or sessions. Deactivate it instead."
          : error.message,
        variant: "destructive",
      });
      setDeleting(false);
      return;
    }
    setCourses((prev) => prev.filter((c) => c.id !== deleteCourse.id));
    if (selectedCourse?.id === deleteCourse.id) {
      setSelectedCourse(null);
      setDrawerOpen(false);
    }
    supabase.from("admin_activity_log").insert({
      event_type: "course_deleted",
      title: "Course Deleted",
      description: `"${deleteCourse.title}" by ${deleteCourse.trainerName} was permanently deleted`,
      metadata: { course_id: deleteCourse.id, trainer_id: deleteCourse.trainer_id },
    });
    toast({ title: "Course deleted" });
    setDeleting(false);
    setDeleteOpen(false);
    setDeleteCourse(null);
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Fetch courses
      const { data: coursesData, error: coursesErr } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (coursesErr) {
        console.error("Error fetching courses:", coursesErr);
        setCourses([]);
        setLoading(false);
        return;
      }

      if (!coursesData || coursesData.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      // Get unique trainer IDs
      const trainerIds = [...new Set(coursesData.map(c => c.trainer_id))];

      // Fetch trainers
      const { data: trainersData } = await supabase
        .from("trainers")
        .select("id, user_id")
        .in("id", trainerIds);

      // Get user IDs from trainers
      const trainerMap = new Map<string, string>();
      (trainersData || []).forEach(t => trainerMap.set(t.id, t.user_id));

      const userIds = [...new Set((trainersData || []).map(t => t.user_id))];

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
      (profilesData || []).forEach(p => profileMap.set(p.id, { full_name: p.full_name, email: p.email }));

      // Merge
      const merged: CourseWithTrainer[] = coursesData.map(c => {
        const userId = trainerMap.get(c.trainer_id) || "";
        const profile = profileMap.get(userId);
        return {
          ...c,
          trainerName: profile?.full_name || "Unknown",
          trainerEmail: profile?.email || "",
        } as CourseWithTrainer;
      });

      setCourses(merged);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const openDetail = async (course: CourseWithTrainer) => {
    setSelectedCourse(course);
    setDrawerOpen(true);
    setLoadingCurriculum(true);
    setSignedCourseUrls({});
    const { data } = await supabase.from("course_curriculum").select("*").eq("course_id", course.id).order("week_number", { ascending: true });
    setCurriculum(data || []);
    setLoadingCurriculum(false);
    // Resolve signed URLs for private-bucket files
    const urls: Record<string, string> = {};
    if (course.curriculum_pdf_url) urls.curriculumPdf = await resolveAdminCourseUrl(course.curriculum_pdf_url, "course-materials");
    if (course.verification_selfie_url) urls.verificationSelfie = await resolveAdminCourseUrl(course.verification_selfie_url, "trainer-documents");
    setSignedCourseUrls(urls);
  };

  const openCommentModal = (courseId: string, action: "rejected" | "changes_requested") => {
    setCommentCourseId(courseId);
    setCommentAction(action);
    setCommentText("");
    setCommentModalOpen(true);
  };

  const handleApprove = async (id: string) => {
    setSubmitting(true);
    const { error } = await supabase.from("courses").update({ approval_status: "approved", is_active: true }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Sync course_status on trainer and mark trainer as live — the trainer is fully
    // active once their profile is approved (done at trainer approval time) AND their
    // first course is approved.
    const course = courses.find(c => c.id === id);
    if (course?.trainer_id) {
      await supabase.from("trainers").update({ course_status: "approved", trainer_status: "live" }).eq("id", course.trainer_id);
    }

    setCourses(prev => prev.map(c => c.id === id ? { ...c, approval_status: "approved", is_active: true } : c));
    if (selectedCourse?.id === id) setSelectedCourse(prev => prev ? { ...prev, approval_status: "approved" } : prev);
    setDrawerOpen(false);
    toast({ title: "Course Approved!", description: "The course is now visible to students." });

    // Send email notification
    supabase.functions.invoke("notify-course-status", {
      body: { course_id: id, status: "approved" },
    }).catch(err => console.error("Email notification error:", err));

    // Log activity
    supabase.from("admin_activity_log").insert({
      event_type: "course_approved",
      title: "Course Approved",
      description: `"${course?.title || "Course"}" by ${course?.trainerName || "Trainer"} was approved`,
      metadata: { course_id: id, trainer_id: course?.trainer_id, status: "approved" },
    });

    setSubmitting(false);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) {
      toast({ title: "Comment required", description: "Please enter a reason/comment.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const newStatus = commentAction === "rejected" ? "rejected" : "changes_requested";
    const { error } = await supabase.from("courses").update({
      approval_status: newStatus,
      is_active: false,
      rejection_reason: commentText.trim(),
    }).eq("id", commentCourseId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Sync course_status on trainer for rejection
    const course = courses.find(c => c.id === commentCourseId);
    if (course?.trainer_id && newStatus === "rejected") {
      await supabase.from("trainers").update({ course_status: "rejected" }).eq("id", course.trainer_id);
    }
    if (course?.trainer_id && newStatus === "changes_requested") {
      await supabase.from("trainers").update({ course_status: "changes_requested" }).eq("id", course.trainer_id);
    }

    setCourses(prev => prev.map(c => c.id === commentCourseId ? { ...c, approval_status: newStatus, is_active: false, rejection_reason: commentText.trim() } : c));
    if (selectedCourse?.id === commentCourseId) setSelectedCourse(prev => prev ? { ...prev, approval_status: newStatus, rejection_reason: commentText.trim() } : prev);
    setDrawerOpen(false);
    setCommentModalOpen(false);

    const actionLabel = newStatus === "rejected" ? "Rejected" : "Changes Requested";
    toast({ title: `Course ${actionLabel}`, description: "The trainer will be notified via email." });

    // Send email notification
    supabase.functions.invoke("notify-course-status", {
      body: { course_id: commentCourseId, status: newStatus, comment: commentText.trim() },
    }).catch(err => console.error("Email notification error:", err));

    // Log activity
    supabase.from("admin_activity_log").insert({
      event_type: newStatus === "rejected" ? "course_rejected" : "course_changes_requested",
      title: `Course ${actionLabel}`,
      description: `"${course?.title || "Course"}" by ${course?.trainerName || "Trainer"} — ${commentText.trim()}`,
      metadata: { course_id: commentCourseId, trainer_id: course?.trainer_id, status: newStatus, comment: commentText.trim() },
    });

    setSubmitting(false);
  };

  const filtered = courses
    .filter(c => {
      if (tab === "all") return true;
      if (tab === "changes_requested") return c.approval_status === "changes_requested";
      return c.approval_status === tab;
    })
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.title?.toLowerCase().includes(q) || c.trainerName?.toLowerCase().includes(q);
    });

  const counts = {
    pending: courses.filter(c => c.approval_status === "pending").length,
    approved: courses.filter(c => c.approval_status === "approved").length,
    rejected: courses.filter(c => c.approval_status === "rejected").length,
    changes_requested: courses.filter(c => c.approval_status === "changes_requested").length,
    all: courses.length,
  };

  const statusColor = (s: string) =>
    s === "approved" ? "bg-emerald-50 text-emerald-700" :
    s === "rejected" ? "bg-destructive/10 text-destructive" :
    s === "changes_requested" ? "bg-orange-50 text-orange-700" :
    "bg-amber-50 text-amber-700";

  const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Course Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review and approve trainer courses</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={fetchCourses} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
            <TabsTrigger value="changes_requested">Changes ({counts.changes_requested})</TabsTrigger>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search course or trainer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-card rounded-xl border animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">No courses found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id} className="bg-card rounded-xl border p-4 hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openDetail(c)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground">{c.title}</h3>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor(c.approval_status || "pending")}`}>
                        {c.approval_status === "changes_requested" ? "Changes Requested" : c.approval_status}
                      </span>
                      {c.has_free_trial && <Badge variant="secondary" className="text-[10px]">Trial</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.trainerName} • {formatINR(Number(c.course_fee))} • {c.duration_days} days • {c.total_sessions} sessions • {c.level}
                    </p>
                    {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">Submitted {formatDateIST(c.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openDetail(c)} title="View">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(c)} title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {(c.approval_status === "pending" || c.approval_status === "changes_requested") && (
                      <>
                        <Button size="sm" className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(c.id)} disabled={submitting} title="Approve">
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-orange-300 text-orange-600 hover:bg-orange-50" onClick={() => openCommentModal(c.id, "changes_requested")} disabled={submitting} title="Request Changes">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => openCommentModal(c.id, "rejected")} disabled={submitting} title="Reject">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => openDelete(c)} title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left">Course Details</SheetTitle>
          </SheetHeader>
          {selectedCourse && (
            <div className="mt-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-foreground">{selectedCourse.title}</h2>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor(selectedCourse.approval_status || "pending")}`}>
                    {selectedCourse.approval_status === "changes_requested" ? "Changes Requested" : selectedCourse.approval_status}
                  </span>
                </div>
                {selectedCourse.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{selectedCourse.description}</p>}
              </div>

              <Separator />

              {/* Trainer Info */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Trainer</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">{selectedCourse.trainerName?.[0] || "T"}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedCourse.trainerName}</p>
                    <p className="text-xs text-muted-foreground">{selectedCourse.trainerEmail}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Course Details Grid */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Course Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: IndianRupee, label: "Fee", value: formatINR(Number(selectedCourse.course_fee)) },
                    { icon: Calendar, label: "Duration", value: `${selectedCourse.duration_days} days` },
                    { icon: Clock, label: "Session Duration", value: `${selectedCourse.session_duration_mins || 60} mins` },
                    { icon: Clock, label: "Sessions", value: `${selectedCourse.total_sessions} sessions` },
                    { icon: Clock, label: "Total Hours", value: `${Math.round(((selectedCourse.total_sessions || 0) * (selectedCourse.session_duration_mins || 60)) / 60)} hrs` },
                    { icon: Users, label: "Enrolled", value: String(selectedCourse.total_enrolled || 0) },
                    { icon: BookOpen, label: "Level", value: selectedCourse.level || "N/A" },
                    { icon: Star, label: "Language", value: selectedCourse.language || "English" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-medium text-foreground">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  {selectedCourse.has_free_trial && <Badge variant="secondary" className="text-xs">Free Trial Available</Badge>}
                  {selectedCourse.session_frequency && <Badge variant="outline" className="text-xs">Frequency: {selectedCourse.session_frequency}</Badge>}
                </div>
              </div>

              {/* What You'll Learn */}
              {selectedCourse.what_you_learn && selectedCourse.what_you_learn.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">What You'll Learn</h4>
                    <ul className="space-y-1">
                      {selectedCourse.what_you_learn.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Who Is It For */}
              {selectedCourse.who_is_it_for && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Who Is It For</h4>
                    <p className="text-sm text-muted-foreground">{selectedCourse.who_is_it_for}</p>
                  </div>
                </>
              )}

              {/* New fields: sessions_per_week, free_trial_enabled */}
              {(selectedCourse.sessions_per_week != null || selectedCourse.free_trial_enabled != null) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Schedule & Trial</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedCourse.sessions_per_week != null && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div><p className="text-[11px] text-muted-foreground">Sessions / Week</p><p className="text-sm font-medium text-foreground">{selectedCourse.sessions_per_week}</p></div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                        <Star className="w-4 h-4 text-muted-foreground" />
                        <div><p className="text-[11px] text-muted-foreground">Free Trial Enabled</p><p className="text-sm font-medium text-foreground">{selectedCourse.free_trial_enabled || selectedCourse.has_free_trial ? "Yes" : "No"}</p></div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Weekly curriculum summary */}
              {selectedCourse.weekly_curriculum?.summary && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Weekly Curriculum Summary</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-2.5 rounded-lg">{selectedCourse.weekly_curriculum.summary}</p>
                  </div>
                </>
              )}

              {/* Media & Uploads */}
              {(selectedCourse.intro_video_url || selectedCourse.curriculum_pdf_url || selectedCourse.certification_url || selectedCourse.verification_selfie_url) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Media & Verification</h4>
                    <div className="space-y-2">
                      {selectedCourse.intro_video_url && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground w-28 shrink-0">Intro Video</span>
                          <a href={selectedCourse.intro_video_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate">▶ View</a>
                        </div>
                      )}
                      {selectedCourse.curriculum_pdf_url && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground w-28 shrink-0">Curriculum PDF</span>
                          {signedCourseUrls.curriculumPdf ? (
                            <a href={signedCourseUrls.curriculumPdf} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">⬇ Download</a>
                          ) : <span className="text-xs text-muted-foreground">Loading…</span>}
                        </div>
                      )}
                      {selectedCourse.certification_url && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground w-28 shrink-0">Certification</span>
                          <a href={selectedCourse.certification_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View</a>
                        </div>
                      )}
                      {selectedCourse.verification_selfie_url && (
                        <div>
                          <p className="text-[11px] text-muted-foreground mb-1">Verification Selfie</p>
                          {signedCourseUrls.verificationSelfie ? (
                            <img src={signedCourseUrls.verificationSelfie} alt="Verification selfie" className="w-24 h-24 object-cover rounded-lg border" loading="lazy" />
                          ) : <span className="text-xs text-muted-foreground">Loading…</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Rejection Reason */}
              {selectedCourse.rejection_reason && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Admin Comment / Rejection Reason</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">{selectedCourse.rejection_reason}</p>
                  </div>
                </>
              )}
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Curriculum</h4>
                {loadingCurriculum ? (
                  <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
                ) : curriculum.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No curriculum added</p>
                ) : (
                  <div className="space-y-2">
                    {curriculum.map((w: any) => (
                      <div key={w.id} className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">Week {w.week_number}: {w.week_title}</p>
                          <span className="text-[11px] text-muted-foreground">{w.session_count} sessions</span>
                        </div>
                        {w.topics?.length > 0 && <p className="text-xs text-muted-foreground mt-1">{w.topics.join(" • ")}</p>}
                        {w.learning_outcome && <p className="text-xs text-primary mt-1">→ {w.learning_outcome}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submission date */}
              <Separator />
              <p className="text-xs text-muted-foreground">Submitted on {formatLongDateIST(selectedCourse.created_at)}</p>

              {/* Actions */}
              {(selectedCourse.approval_status === "pending" || selectedCourse.approval_status === "changes_requested") && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(selectedCourse.id)} disabled={submitting}>
                    <Check className="w-4 h-4" /> Approve
                  </Button>
                  <Button variant="outline" className="flex-1 gap-1.5 border-orange-300 text-orange-600 hover:bg-orange-50" onClick={() => openCommentModal(selectedCourse.id, "changes_requested")} disabled={submitting}>
                    <MessageSquare className="w-4 h-4" /> Request Changes
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-1.5" onClick={() => openCommentModal(selectedCourse.id, "rejected")} disabled={submitting}>
                    <X className="w-4 h-4" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Comment Modal for Reject / Request Changes */}
      <Dialog open={commentModalOpen} onOpenChange={setCommentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {commentAction === "rejected" ? "Reject Course" : "Request Changes"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {commentAction === "rejected"
                ? "Please provide a reason for rejecting this course. The trainer will be notified via email."
                : "Please describe the changes required. The trainer will be notified via email."}
            </p>
            <Textarea
              placeholder={commentAction === "rejected" ? "Reason for rejection..." : "Describe the changes needed..."}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={commentAction === "rejected" ? "destructive" : "default"}
              onClick={handleCommentSubmit}
              disabled={submitting || !commentText.trim()}
            >
              {submitting ? "Submitting..." : commentAction === "rejected" ? "Reject Course" : "Request Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCourses;
