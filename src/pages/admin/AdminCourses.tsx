import { useState, useEffect } from "react";
import { formatDateIST, formatLongDateIST } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import { BookOpen, Check, X, Eye, Search, RefreshCw, Clock, Users, IndianRupee, Calendar, Star, ExternalLink } from "lucide-react";

const AdminCourses = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const { toast } = useToast();

  const fetchCourses = async () => {
    setLoading(true);
    const { data } = await supabase.from("courses").select("*, trainers(*, profiles(*))").order("created_at", { ascending: false });
    setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const openDetail = async (course: any) => {
    setSelectedCourse(course);
    setDrawerOpen(true);
    setLoadingCurriculum(true);
    const { data } = await supabase.from("course_curriculum").select("*").eq("course_id", course.id).order("week_number", { ascending: true });
    setCurriculum(data || []);
    setLoadingCurriculum(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("courses").update({ approval_status: status, is_active: status === "approved" }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    // Extend: sync course_status on the trainer record
    const course = courses.find(c => c.id === id);
    if (course?.trainer_id) {
      const courseStatusUpdate: any = {};
      if (status === "approved") {
        courseStatusUpdate.course_status = "approved";
      } else if (status === "rejected") {
        courseStatusUpdate.course_status = "rejected";
      }
      if (Object.keys(courseStatusUpdate).length > 0) {
        await supabase.from("trainers").update(courseStatusUpdate).eq("id", course.trainer_id);
      }
    }

    setCourses(prev => prev.map(c => c.id === id ? { ...c, approval_status: status, is_active: status === "approved" } : c));
    if (selectedCourse?.id === id) setSelectedCourse((prev: any) => prev ? { ...prev, approval_status: status } : prev);
    setDrawerOpen(false);
    toast({ title: `Course ${status}!`, description: status === "approved" ? "The course is now visible to students." : "The trainer will be notified.", variant: "success" });

    // Log activity
    supabase.from("admin_activity_log").insert({
      event_type: status === "approved" ? "course_approved" : "course_rejected",
      title: `Course ${status === "approved" ? "Approved" : "Rejected"}`,
      description: `"${course?.title || "Course"}" by ${course?.trainerName || "Trainer"} was ${status}`,
      metadata: { course_id: id, trainer_id: course?.trainer_id, status },
    });
  };

  const filtered = courses
    .filter(c => tab === "all" || c.approval_status === tab)
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.title?.toLowerCase().includes(q) || c.trainers?.profiles?.full_name?.toLowerCase().includes(q);
    });

  const counts = {
    pending: courses.filter(c => c.approval_status === "pending").length,
    approved: courses.filter(c => c.approval_status === "approved").length,
    rejected: courses.filter(c => c.approval_status === "rejected").length,
    all: courses.length,
  };

  const statusColor = (s: string) =>
    s === "approved" ? "bg-emerald-50 text-emerald-700" :
    s === "rejected" ? "bg-destructive/10 text-destructive" :
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
          <TabsList>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
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
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor(c.approval_status)}`}>{c.approval_status}</span>
                      {c.has_free_trial && <Badge variant="secondary" className="text-[10px]">Trial</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.trainers?.profiles?.full_name || "Unknown"} • {formatINR(Number(c.course_fee))} • {c.duration_days}d • {c.total_sessions} sessions • {c.level}
                    </p>
                    {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">Submitted {formatDateIST(c.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openDetail(c)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {c.approval_status === "pending" && (
                      <>
                        <Button size="sm" className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(c.id, "approved")}>
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => updateStatus(c.id, "rejected")}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
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
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor(selectedCourse.approval_status)}`}>{selectedCourse.approval_status}</span>
                </div>
                {selectedCourse.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{selectedCourse.description}</p>}
              </div>

              <Separator />

              {/* Trainer Info */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Trainer</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">{selectedCourse.trainers?.profiles?.full_name?.[0] || "T"}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedCourse.trainers?.profiles?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{selectedCourse.trainers?.profiles?.email} • {selectedCourse.trainers?.experience_years || 0}y exp</p>
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
                    { icon: Clock, label: "Sessions", value: `${selectedCourse.total_sessions} × ${selectedCourse.session_duration_mins || 60}min` },
                    { icon: Users, label: "Enrolled", value: String(selectedCourse.total_enrolled || 0) },
                    { icon: BookOpen, label: "Level", value: selectedCourse.level },
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
                  {selectedCourse.session_frequency && <Badge variant="outline" className="text-xs">{selectedCourse.session_frequency}</Badge>}
                </div>
              </div>

              {/* What You'll Learn */}
              {selectedCourse.what_you_learn?.length > 0 && (
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

              {/* Curriculum */}
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
              {selectedCourse.approval_status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(selectedCourse.id, "approved")}>
                    <Check className="w-4 h-4" /> Approve
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-1.5" onClick={() => updateStatus(selectedCourse.id, "rejected")}>
                    <X className="w-4 h-4" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
};

export default AdminCourses;
