import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, BadgeCheck, Globe, Clock, Users, Calendar, ArrowRight, ChevronRight, Flag, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { isDemo, getDemoTrainer, getDemoCourse, demoTestimonials, demoTrainers } from "@/lib/demoData";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReportTrainerModal from "@/components/ReportTrainerModal";

const DAYS_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TrainerProfile = () => {
  const { id } = useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trainer, setTrainer] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [similarTrainers, setSimilarTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedId, setResolvedId] = useState<string | undefined>(id);
  const [isVerified, setIsVerified] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Modal states
  const [enrollCourse, setEnrollCourse] = useState<any>(null);
  const [showPaymentComing, setShowPaymentComing] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialDate, setTrialDate] = useState<Date | undefined>();
  const [trialTime, setTrialTime] = useState<string>("");
  const [trialGoal, setTrialGoal] = useState("");
  const [bookingTrial, setBookingTrial] = useState(false);
  const [existingTrial, setExistingTrial] = useState<any>(null);
  const [checkingTrial, setCheckingTrial] = useState(false);

  useEffect(() => {
    if (id) { setResolvedId(id); return; }
    if (!user) return;
    (async () => {
      const { data: t } = await supabase.from("trainers").select("id").eq("user_id", user.id).single();
      if (t) setResolvedId(t.id);
      else setLoading(false);
    })();
  }, [id, user]);

  useEffect(() => {
    if (!resolvedId) return;

    if (isDemo(resolvedId)) {
      const demo = getDemoTrainer(resolvedId);
      if (demo) {
        setTrainer(demo);
        setCourses(getDemoCourse(resolvedId));
        setReviews(demoTestimonials.slice(0, 2));
        setAvailability([
          { day_of_week: 1, start_time: "09:00", end_time: "12:00", is_available: true },
          { day_of_week: 2, start_time: "14:00", end_time: "18:00", is_available: true },
          { day_of_week: 3, start_time: "09:00", end_time: "12:00", is_available: true },
          { day_of_week: 5, start_time: "10:00", end_time: "16:00", is_available: true },
          { day_of_week: 6, start_time: "09:00", end_time: "13:00", is_available: true },
        ]);
        setSimilarTrainers(demoTrainers.filter(t => t.id !== resolvedId).slice(0, 3));
      }
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data: t } = await supabase.from("trainers").select("*").eq("id", resolvedId).single();
        if (t) {
          const profileMap = await fetchProfilesMap([t.user_id]);
          setTrainer({ ...t, profile: profileMap[t.user_id] });

          const [coursesRes, ratingsRes, availRes, docsRes] = await Promise.all([
            supabase.from("courses").select("*").eq("trainer_id", resolvedId).eq("approval_status", "approved"),
            supabase.from("ratings").select("*").eq("trainer_id", resolvedId).not("student_to_trainer_rating", "is", null).order("created_at", { ascending: false }).limit(5),
            supabase.from("trainer_availability").select("*").eq("trainer_id", resolvedId).eq("is_available", true),
            supabase.from("trainer_documents").select("verification_status").eq("trainer_id", resolvedId),
          ]);

          setCourses(coursesRes.data || []);
          setAvailability(availRes.data || []);
          const docs = docsRes.data || [];
          const allApproved = docs.length > 0 && docs.every(d => d.verification_status === "approved");
          setIsVerified(allApproved);

          if (ratingsRes.data && ratingsRes.data.length > 0) {
            const studentIds = ratingsRes.data.map(r => r.student_id);
            const { data: studentData } = await supabase.from("students").select("id, user_id").in("id", studentIds);
            const sUserIds = (studentData || []).map(s => s.user_id);
            const sProfileMap = await fetchProfilesMap(sUserIds);
            const studentMap: Record<string, any> = {};
            (studentData || []).forEach(s => { studentMap[s.id] = sProfileMap[s.user_id]; });
            setReviews(ratingsRes.data.map(r => ({
              student: studentMap[r.student_id]?.full_name || "Student",
              rating: r.student_to_trainer_rating || 5,
              text: r.student_to_trainer_review || r.student_review_text || "Excellent training experience!",
              date: new Date(r.created_at || "").toLocaleDateString(),
            })));
          }

          const skills = t.skills || [];
          if (skills.length > 0) {
            const { data: similar } = await supabase.from("trainers").select("*").eq("approval_status", "approved").neq("id", resolvedId).limit(10);
            if (similar) {
              const simUserIds = similar.map(s => s.user_id);
              const simProfiles = await fetchProfilesMap(simUserIds);
              const withProfiles = similar.map(s => ({ ...s, profile: simProfiles[s.user_id] }));
              const scored = withProfiles.map(s => ({
                ...s, overlap: (s.skills || []).filter((sk: string) => skills.includes(sk)).length
              })).sort((a, b) => b.overlap - a.overlap).slice(0, 3);
              setSimilarTrainers(scored);
            }
          }
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, [resolvedId]);

  // Check for existing trial when trial modal opens
  const checkExistingTrial = async () => {
    if (!user || !resolvedId || isDemo(resolvedId)) return;
    setCheckingTrial(true);
    try {
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (!student) { setCheckingTrial(false); return; }

      const { data: enrollments } = await supabase.from("enrollments").select("id").eq("student_id", student.id).eq("trainer_id", resolvedId);
      if (!enrollments || enrollments.length === 0) { setCheckingTrial(false); return; }

      const enrollIds = enrollments.map(e => e.id);
      const { data: trials } = await supabase.from("course_sessions")
        .select("*")
        .in("enrollment_id", enrollIds)
        .eq("is_trial", true)
        .in("status", ["upcoming", "scheduled"]);

      if (trials && trials.length > 0) {
        setExistingTrial(trials[0]);
      }
    } catch (err) { console.error(err); }
    setCheckingTrial(false);
  };

  const requireAuth = (action: string): boolean => {
    if (!user || role !== "student") {
      setShowAuthPrompt(true);
      return false;
    }
    return true;
  };

  const handleEnrollClick = (course?: any) => {
    if (!requireAuth("enroll")) return;
    const c = course || courses[0];
    if (!c) {
      toast({ title: "No courses available for this trainer", variant: "info" });
      return;
    }
    setEnrollCourse(c);
  };

  const handleTrialClick = () => {
    if (!requireAuth("book a free trial")) return;
    setShowTrialModal(true);
    setTrialDate(undefined);
    setTrialTime("");
    setTrialGoal("");
    setExistingTrial(null);
    checkExistingTrial();
  };

  const handleBookTrial = async () => {
    if (!trialDate || !trialTime) {
      toast({ title: "Please select a date and time", variant: "destructive" });
      return;
    }

    // For demo trainers, show success without DB
    if (isDemo(resolvedId || "")) {
      toast({ title: "Your free trial is booked!", description: "Check your email for details.", variant: "success" });
      setShowTrialModal(false);
      return;
    }

    setBookingTrial(true);
    try {
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user!.id).single();
      if (!student) throw new Error("Student profile not found");

      // Get or create enrollment for trial
      let enrollmentId: string;
      const courseToUse = courses[0];
      if (!courseToUse) throw new Error("No course available");

      const { data: existingEnrollment } = await supabase.from("enrollments")
        .select("id")
        .eq("student_id", student.id)
        .eq("trainer_id", resolvedId!)
        .eq("course_id", courseToUse.id)
        .maybeSingle();

      if (existingEnrollment) {
        enrollmentId = existingEnrollment.id;
      } else {
        const { data: newEnrollment, error: enrollErr } = await supabase.from("enrollments").insert({
          student_id: student.id,
          trainer_id: resolvedId!,
          course_id: courseToUse.id,
          status: "trial",
          amount_paid: 0,
        }).select("id").single();
        if (enrollErr) throw enrollErr;
        enrollmentId = newEnrollment.id;
      }

      // Create trial session
      const scheduledAt = new Date(trialDate);
      const [hours, minutes] = trialTime.split(":").map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const { error: sessionErr } = await supabase.from("course_sessions").insert({
        enrollment_id: enrollmentId,
        trainer_id: resolvedId!,
        is_trial: true,
        status: "upcoming",
        title: `Free Trial — ${courseToUse.title || "Session"}`,
        scheduled_at: scheduledAt.toISOString(),
        duration_mins: 30,
        session_number: 0,
        notes: trialGoal || null,
      });
      if (sessionErr) throw sessionErr;

      // Send notification to trainer
      await supabase.from("notifications").insert({
        user_id: trainer.user_id,
        title: "New Trial Booking",
        body: `New trial booking from ${user!.user_metadata?.full_name || "a student"} on ${format(scheduledAt, "dd MMM yyyy")} at ${trialTime}`,
        type: "trial_booking",
        action_url: "/trainer/sessions",
      });

      toast({ title: "Your free trial is booked!", description: "Check your email for details.", variant: "success" });
      setShowTrialModal(false);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to book trial", description: err.message, variant: "destructive" });
    } finally {
      setBookingTrial(false);
    }
  };

  // Generate time slots from availability for the selected date
  const getTimeSlotsForDate = (date: Date | undefined) => {
    if (!date) return [];
    const dayOfWeek = date.getDay();
    const daySlots = availability.filter(a => a.day_of_week === dayOfWeek && a.is_available);
    const slots: string[] = [];
    daySlots.forEach(s => {
      const startH = parseInt(s.start_time?.split(":")[0] || "0");
      const endH = parseInt(s.end_time?.split(":")[0] || "0");
      for (let h = startH; h < endH; h++) {
        slots.push(`${h.toString().padStart(2, "0")}:00`);
        slots.push(`${h.toString().padStart(2, "0")}:30`);
      }
    });
    return slots;
  };

  const availableDays = availability.map(a => a.day_of_week);
  const isDateAvailable = (date: Date) => {
    if (date < new Date()) return false;
    return availableDays.includes(date.getDay());
  };

  const name = trainer?.profile?.full_name || "Trainer";
  const avatarColor = trainer?.avatarColor || "#1A56DB";
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);

  usePageMeta({
    title: loading ? "Trainer Profile — SkillMitra" : `${name} — Expert Trainer on SkillMitra`,
    description: loading ? "View trainer profile on SkillMitra" : `Learn from ${name}, ${trainer?.current_role || "Expert Trainer"}. Book 1:1 sessions on SkillMitra.`,
    jsonLd: !loading && trainer ? {
      "@context": "https://schema.org",
      "@type": "Course",
      provider: { "@type": "Organization", name: "SkillMitra", url: "https://skillmitra.online" },
      instructor: { "@type": "Person", name },
      name: courses[0]?.title || `${name}'s Training`,
      description: trainer?.bio || `Personal 1:1 training by ${name}`,
    } : undefined,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12 hero-gradient"><div className="container mx-auto px-4 lg:px-8"><Skeleton className="h-32 w-32 rounded-2xl" /><Skeleton className="h-8 w-64 mt-4" /></div></div>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">Trainer not found</h1>
          <Link to="/browse"><Button className="mt-4">Browse Trainers</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const trainerCourses = courses;
  const minFee = trainerCourses.length > 0
    ? Math.min(...trainerCourses.map((c: any) => Number(c.fee || c.course_fee || 0)))
    : 0;

  const timeSlots = getTimeSlotsForDate(trialDate);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="hero-gradient pt-24 pb-12 lg:pt-28 lg:pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl border-4 border-primary-foreground/20 flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${avatarColor}25` }}>
              <span className="text-primary-foreground font-bold text-3xl lg:text-4xl" style={{ color: avatarColor }}>{initials}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-bold text-primary-foreground">{name}</h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Expert
                  </span>
                )}
                {!isVerified && <BadgeCheck className="w-6 h-6 text-accent" />}
                {trainer.subscription_plan === "elite" && <span className="text-xs font-bold px-2 py-1 rounded gold-gradient text-accent-foreground">ELITE</span>}
              </div>
              <p className="text-primary-foreground/70 mt-1">
                {trainer.current_role} {trainer.current_company ? `at ${trainer.current_company}` : ""} • {trainer.experience_years || 0} years experience
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-primary-foreground/60">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-accent fill-accent" /> {trainer.average_rating} ({reviews.length} reviews)</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {trainer.total_students} students</span>
                {trainer.teaching_languages && <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {trainer.teaching_languages.join(", ")}</span>}
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Responds &lt; 2 hours</span>
              </div>
              {user && id && (
                <Button variant="ghost" size="sm" onClick={() => setShowReport(true)}
                  className="text-primary-foreground/50 hover:text-primary-foreground hover:bg-primary-foreground/10 mt-4 lg:mt-0">
                  <Flag className="w-4 h-4 mr-1.5" /> Report
                </Button>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                {(trainer.skills || []).map((s: string) => (
                  <span key={s} className="text-xs px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground/80 font-medium">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main — Tabbed */}
          <div className="flex-1 min-w-0">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start bg-muted/50 mb-6">
                <TabsTrigger value="about" className="flex-1 sm:flex-none">About</TabsTrigger>
                <TabsTrigger value="courses" className="flex-1 sm:flex-none">Courses ({trainerCourses.length})</TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1 sm:flex-none">Reviews ({reviews.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                {trainer.bio && (
                  <section className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-3">About</h2>
                    <p className="text-muted-foreground leading-relaxed">{trainer.bio}</p>
                  </section>
                )}

                {availability.length > 0 && (
                  <section className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Availability</h2>
                    <div className="grid grid-cols-7 gap-2">
                      {DAYS_LABEL.map((day, idx) => {
                        const slots = availability.filter(a => a.day_of_week === idx);
                        const hasSlot = slots.length > 0;
                        return (
                          <div key={day} className={`rounded-xl p-3 text-center border transition-colors ${hasSlot ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'}`}>
                            <p className={`text-xs font-semibold ${hasSlot ? 'text-primary' : 'text-muted-foreground'}`}>{day}</p>
                            {hasSlot ? slots.map((s, i) => (
                              <p key={i} className="text-[10px] text-muted-foreground mt-1">{s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}</p>
                            )) : (
                              <p className="text-[10px] text-muted-foreground/50 mt-1">—</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </TabsContent>

              <TabsContent value="courses" className="space-y-4">
                {trainerCourses.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">No courses available yet</p>
                  </div>
                ) : trainerCourses.map((c: any) => {
                  const fee = c.fee || c.course_fee || 0;
                  const dur = c.duration || (c.duration_days ? `${c.duration_days} days` : "");
                  const sess = c.sessions || c.total_sessions || 0;
                  const lvl = c.level || "All Levels";
                  const curriculum = c.curriculum || c.what_you_learn || [];

                  return (
                    <div key={c.id} className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link to={`/course/${c.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">{c.title}</Link>
                          <p className="text-sm text-muted-foreground mt-1">{c.description || ""}</p>
                          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {dur}</span>
                            <span>{sess} sessions</span>
                            <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{lvl}</span>
                          </div>
                          {curriculum.length > 0 && (
                            <ul className="mt-3 space-y-1">
                              {curriculum.slice(0, 4).map((topic: string) => (
                                <li key={topic} className="text-xs text-muted-foreground flex items-center gap-1"><ChevronRight className="w-3 h-3 text-accent" />{topic}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-bold text-foreground">₹{Number(fee).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{dur}</p>
                          <Link to={`/course/${c.id}`}>
                            <Button size="sm" className="mt-3 hero-gradient border-0 text-xs">View Course</Button>
                          </Link>
                          <Button size="sm" variant="outline" className="mt-2 text-xs w-full" onClick={() => handleEnrollClick(c)}>Enroll Now</Button>
                          <p className="text-xs text-accent mt-2 cursor-pointer hover:underline" onClick={handleTrialClick}>Free Trial Available</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <Star className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">No reviews yet</p>
                  </div>
                ) : reviews.map((r: any, idx: number) => {
                  const rName = r.student || r.name || "Student";
                  return (
                    <div key={idx} className="bg-card rounded-xl border border-border p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full hero-gradient flex items-center justify-center">
                          <span className="text-primary-foreground text-xs font-bold">{rName[0]}</span>
                        </div>
                        <span className="font-medium text-foreground text-sm">{rName}</span>
                        <div className="flex gap-0.5">{[...Array(r.rating || 5)].map((_, i) => <Star key={i} className="w-3 h-3 text-accent fill-accent" />)}</div>
                        {r.date && <span className="text-xs text-muted-foreground ml-auto">{r.date}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{r.text}</p>
                    </div>
                  );
                })}
              </TabsContent>
            </Tabs>

            {/* Similar Trainers */}
            {similarTrainers.length > 0 && (
              <section className="mt-10">
                <h2 className="text-lg font-semibold text-foreground mb-4">Similar Trainers</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {similarTrainers.map(t => {
                    const sName = t.profile?.full_name || "Trainer";
                    const sInitials = sName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                    const sColor = t.avatarColor || "#1A56DB";
                    return (
                      <Link key={t.id} to={`/trainer/${t.id}`} className="block group">
                        <div className="bg-card rounded-xl border border-border p-4 hover:shadow-md hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${sColor}15` }}>
                              <span className="text-xs font-bold" style={{ color: sColor }}>{sInitials}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="text-sm font-semibold text-foreground truncate">{sName}</p>
                                <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{t.current_role}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="w-3 h-3 text-accent fill-accent" />
                              <span className="font-medium text-foreground">{t.average_rating}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{t.total_students} students</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
              <h3 className="font-semibold text-foreground mb-4">Quick Enroll</h3>
              {minFee > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-1">Starting from</p>
                  <p className="text-3xl font-bold text-foreground">₹{minFee.toLocaleString()}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Contact for pricing</p>
              )}
              <Button className="w-full mt-4 hero-gradient border-0 font-semibold h-11" onClick={() => handleEnrollClick()}>
                Enroll Now <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full mt-2 h-11 font-semibold" onClick={handleTrialClick}>
                Book Free Trial
              </Button>
              <div className="mt-6 pt-4 border-t border-border space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Next available slot</span>
                  <span className="text-foreground font-medium">Today, 6 PM</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Response time</span>
                  <span className="text-foreground font-medium">&lt; 2 hours</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Students trained</span>
                  <span className="text-foreground font-medium">{trainer.total_students}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />

      {showReport && (
        <ReportTrainerModal
          trainerId={resolvedId || ""}
          trainerName={name}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Auth Prompt Modal */}
      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent className="max-w-sm text-center bg-background shadow-xl border">
          <div className="flex flex-col items-center gap-5 py-4">
            <img src="/skillmitra-logo.png" alt="SkillMitra" className="h-10 object-contain" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Join SkillMitra to Get Started</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Create a free student account to book trial sessions with verified expert trainers.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 w-full mt-1">
              <Button className="w-full h-11 text-base font-semibold" onClick={() => { setShowAuthPrompt(false); navigate(`/student/signup`); }}>
                Sign Up Free
              </Button>
              <Button variant="outline" className="w-full h-11" onClick={() => { setShowAuthPrompt(false); navigate(`/student/login?redirect=/trainer/${resolvedId}`); }}>
                Log In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enrollment Confirmation Modal */}
      <Dialog open={!!enrollCourse} onOpenChange={(open) => { if (!open) setEnrollCourse(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Enrollment</DialogTitle>
          </DialogHeader>
          {enrollCourse && (
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trainer</span>
                  <span className="font-medium text-foreground">{name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Course</span>
                  <span className="font-medium text-foreground">{enrollCourse.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Course Fee</span>
                  <span className="font-bold text-foreground text-lg">₹{Number(enrollCourse.fee || enrollCourse.course_fee || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">SkillMitra Guarantee</p>
                  <p className="text-xs text-muted-foreground">100% refund if not satisfied within the first session</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEnrollCourse(null)}>Cancel</Button>
                <Button className="flex-1 hero-gradient border-0" onClick={() => { setEnrollCourse(null); setShowPaymentComing(true); }}>
                  Proceed to Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Coming Soon Modal */}
      <Dialog open={showPaymentComing} onOpenChange={setShowPaymentComing}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Coming Soon</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <AlertCircle className="w-12 h-12 text-accent mx-auto" />
            <p className="text-sm text-muted-foreground">Payments will be available shortly. Please book a free trial session first to experience the training.</p>
            <Button className="w-full" onClick={() => { setShowPaymentComing(false); handleTrialClick(); }}>
              Book Free Trial Instead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Book Free Trial Modal */}
      <Dialog open={showTrialModal} onOpenChange={setShowTrialModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Free Trial</DialogTitle>
          </DialogHeader>

          {checkingTrial ? (
            <div className="py-8 text-center text-muted-foreground">Checking availability...</div>
          ) : existingTrial ? (
            <div className="space-y-4 text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <div>
                <p className="font-semibold text-foreground">Your trial is already scheduled!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {existingTrial.scheduled_at ? format(new Date(existingTrial.scheduled_at), "dd MMM yyyy 'at' hh:mm a") : "Date pending"}
                </p>
              </div>
              {existingTrial.meet_link && (
                <Button asChild className="w-full">
                  <a href={existingTrial.meet_link} target="_blank" rel="noopener noreferrer">Join Session</a>
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={() => setShowTrialModal(false)}>Close</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Trainer info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${avatarColor}15` }}>
                  <span className="text-sm font-bold" style={{ color: avatarColor }}>{initials}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">{trainer.current_role}</p>
                </div>
              </div>

              {/* Date picker */}
              <div>
                <label className="text-sm font-medium text-foreground">Select preferred date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1.5 justify-start text-left font-normal", !trialDate && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {trialDate ? format(trialDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={trialDate}
                      onSelect={setTrialDate}
                      disabled={(date) => !isDateAvailable(date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time slots */}
              {trialDate && (
                <div>
                  <label className="text-sm font-medium text-foreground">Select preferred time</label>
                  {timeSlots.length === 0 ? (
                    <p className="text-xs text-muted-foreground mt-1">No slots available on this day</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {timeSlots.map(slot => (
                        <button key={slot} onClick={() => setTrialTime(slot)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${trialTime === slot ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary/30'}`}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Goal */}
              <div>
                <label className="text-sm font-medium text-foreground">Your goal <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Textarea value={trialGoal} onChange={e => setTrialGoal(e.target.value)} placeholder="What do you want to learn?"
                  className="mt-1.5 min-h-[80px]" />
              </div>

              <Button className="w-full hero-gradient border-0" onClick={handleBookTrial} disabled={bookingTrial || !trialDate || !trialTime}>
                {bookingTrial ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerProfile;
