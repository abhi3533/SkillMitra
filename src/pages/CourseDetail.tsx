import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getDemoCourse, getDemoTrainer, isDemo } from "@/lib/demoData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EnrollmentModal from "@/components/EnrollmentModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Users, BookOpen, CheckCircle2, ArrowLeft, GraduationCap, Globe, User, BadgeCheck, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [trainer, setTrainer] = useState<any>(null);
  const [trainerProfile, setTrainerProfile] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [hasExistingEnrollment, setHasExistingEnrollment] = useState(false);
  const [hasTrialBooked, setHasTrialBooked] = useState(false);

  usePageMeta({
    title: course ? `${course.title} — SkillMitra` : "Course Details — SkillMitra",
    description: course?.description || "View course details and enroll on SkillMitra",
  });

  useEffect(() => {
    if (!courseId) return;
    loadCourseData();
  }, [courseId]);

  useEffect(() => {
    if (user && role === "student" && trainer) {
      checkStudentStatus();
    }
  }, [user, role, trainer]);

  const checkStudentStatus = async () => {
    if (!user) return;
    const { data: student } = await supabase
      .from("students").select("id").eq("user_id", user.id).single();
    if (!student) return;
    setStudentId(student.id);

    // Check existing enrollment for this course
    const { data: enrollment } = await supabase
      .from("enrollments").select("id").eq("student_id", student.id)
      .eq("course_id", courseId!).maybeSingle();
    setHasExistingEnrollment(!!enrollment);

    // Check if trial already booked with this trainer
    if (trainer) {
      const { data: trial } = await supabase
        .from("course_sessions").select("id")
        .eq("trainer_id", trainer.id).eq("is_trial", true)
        .in("enrollment_id", 
          (await supabase.from("enrollments").select("id").eq("student_id", student.id).eq("trainer_id", trainer.id)).data?.map((e: any) => e.id) || []
        ).maybeSingle();
      setHasTrialBooked(!!trial);
    }
  };

  const loadCourseData = async () => {
    setLoading(true);

    // Check if demo course
    if (courseId?.startsWith("demo-")) {
      const allDemoCourses = [
        ...getDemoCourse("demo-trainer-1") || [],
        ...getDemoCourse("demo-trainer-2") || [],
        ...getDemoCourse("demo-trainer-3") || [],
        ...getDemoCourse("demo-trainer-4") || [],
        ...getDemoCourse("demo-trainer-5") || [],
        ...getDemoCourse("demo-trainer-6") || [],
      ];
      const demoCourse = allDemoCourses.find(c => c.id === courseId);
      if (demoCourse) {
        setCourse({
          id: demoCourse.id,
          title: demoCourse.title,
          description: demoCourse.description,
          course_fee: demoCourse.fee,
          total_sessions: demoCourse.sessions,
          level: demoCourse.level,
          duration_days: parseInt(demoCourse.duration) * 30 || 90,
          has_free_trial: true,
          language: "English",
          what_you_learn: demoCourse.curriculum,
        });
        const demoTrainer = getDemoTrainer(demoCourse.trainerId);
        if (demoTrainer) {
          setTrainer(demoTrainer);
          setTrainerProfile(demoTrainer.profile);
        }
      }
      setLoading(false);
      return;
    }

    // Real course
    const { data: courseData } = await supabase
      .from("courses").select("*").eq("id", courseId!).single();
    if (!courseData) { setLoading(false); return; }
    setCourse(courseData);

    // Fetch trainer (via secure RPC) and curriculum in parallel
    const [{ data: trainerRpc }, { data: curriculumData }] = await Promise.all([
      supabase.rpc("get_public_trainer_profile", { trainer_row_id: courseData.trainer_id }),
      supabase.from("course_curriculum").select("*").eq("course_id", courseId!).order("week_number"),
    ]);

    const t = trainerRpc?.[0];
    if (t) {
      const trainerData = {
        id: t.trainer_id, user_id: t.trainer_user_id, bio: t.trainer_bio,
        skills: t.trainer_skills, experience_years: t.trainer_experience_years,
        current_company: t.trainer_current_company, current_role: t.trainer_current_role,
        teaching_languages: t.trainer_teaching_languages, average_rating: t.trainer_average_rating,
        total_students: t.trainer_total_students, approval_status: t.trainer_approval_status,
        intro_video_url: t.trainer_intro_video_url, linkedin_url: t.trainer_linkedin_url,
        previous_companies: t.trainer_previous_companies, subscription_plan: t.trainer_subscription_plan,
        is_job_seeker: t.trainer_is_job_seeker,
      };
      setTrainer(trainerData);
      const { data: profileRpc } = await supabase.rpc("get_public_profile", { profile_id: t.trainer_user_id });
      const p = profileRpc?.[0];
      if (p) {
        setTrainerProfile({ id: p.p_id, full_name: p.p_full_name, city: p.p_city, state: p.p_state, profile_picture_url: p.p_profile_picture_url, is_verified: p.p_is_verified, gender: p.p_gender });
      }
    }
    setCurriculum(curriculumData || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center py-20">
          <h2 className="text-xl font-semibold text-foreground">Course not found</h2>
          <Link to="/browse" className="text-primary mt-4 inline-block">← Browse Trainers</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const durationLabel = course.duration_days
    ? course.duration_days >= 60 ? `${Math.round(course.duration_days / 30)} months`
    : `${course.duration_days} days`
    : "Flexible";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="container mx-auto px-4 lg:px-8 pb-16">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                {/* Course Header */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">{course.level || "Beginner"}</Badge>
                    {course.has_free_trial && <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Free Trial Available</Badge>}
                    {course.language && <Badge variant="outline" className="text-xs"><Globe className="w-3 h-3 mr-1" />{course.language}</Badge>}
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{course.title}</h1>
                  <p className="text-muted-foreground leading-relaxed">{course.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{durationLabel}</span>
                    {course.total_sessions && <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{course.total_sessions} Sessions</span>}
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{course.total_enrolled || 0} Enrolled</span>
                    {course.average_rating > 0 && (
                      <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-accent text-accent" />{course.average_rating}</span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* What You'll Learn */}
              {(course.what_you_learn?.length > 0) && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" /> What You'll Learn
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {course.what_you_learn.map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Curriculum */}
              {curriculum.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" /> Course Curriculum
                  </h2>
                  <div className="space-y-4">
                    {curriculum.map((week, i) => (
                      <div key={week.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-foreground text-sm">
                            Week {week.week_number || i + 1}: {week.week_title || "Module"}
                          </h3>
                          {week.session_count && (
                            <span className="text-xs text-muted-foreground">{week.session_count} sessions</span>
                          )}
                        </div>
                        {week.topics?.length > 0 && (
                          <ul className="space-y-1 ml-4">
                            {week.topics.map((topic: string, j: number) => (
                              <li key={j} className="text-sm text-muted-foreground list-disc">{topic}</li>
                            ))}
                          </ul>
                        )}
                        {week.learning_outcome && (
                          <p className="mt-2 text-xs text-primary/80 italic">Outcome: {week.learning_outcome}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Who Is It For */}
              {course.who_is_it_for && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-3">Who Is This Course For?</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{course.who_is_it_for}</p>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-5">
                {/* Pricing Card */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="bg-card rounded-xl border border-border p-6 shadow-sm">
                  <div className="text-center mb-5">
                    <div className="text-3xl font-bold text-foreground">₹{Number(course.course_fee).toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground mt-1">Full course fee</p>
                  </div>

                  {hasExistingEnrollment ? (
                    <Button className="w-full" onClick={() => navigate("/student/courses")}>
                      Go to My Courses
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      {course.has_free_trial && !hasTrialBooked && (
                        <Button className="w-full" size="lg" onClick={() => handleEnrollClick()}>
                          Book Free Trial
                        </Button>
                      )}
                      <Button variant={course.has_free_trial && !hasTrialBooked ? "outline" : "default"} className="w-full" size="lg"
                        onClick={() => handleEnrollClick()}>
                        Enroll Now
                      </Button>
                    </div>
                  )}

                  <div className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> 1-on-1 personal training</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Flexible scheduling</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Certificate on completion</div>
                    {course.has_free_trial && (
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Free trial session</div>
                    )}
                  </div>
                </motion.div>

                {/* Trainer Card */}
                {trainer && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Your Trainer</h3>
                    <Link to={`/trainer/${trainer.id}`} className="flex items-center gap-3 group">
                      {trainerProfile?.profile_picture_url ? (
                        <img src={trainerProfile.profile_picture_url} alt={trainerProfile?.full_name}
                          className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                          <User className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground text-sm group-hover:text-primary transition-colors truncate">
                            {trainerProfile?.full_name || "Trainer"}
                          </span>
                          <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground">{trainer.current_role}</p>
                      </div>
                    </Link>
                    {trainer.current_company && (
                      <p className="mt-2 text-xs text-accent font-medium">{trainer.current_company}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-accent text-accent" />
                        {Number(trainer.average_rating) > 0 ? trainer.average_rating : "New"}
                      </span>
                      <span>{trainer.experience_years || 0}y exp</span>
                      <span>{trainer.total_students || 0} students</span>
                    </div>
                    {trainer.bio && (
                      <p className="mt-3 text-xs text-muted-foreground line-clamp-3">{trainer.bio}</p>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEnrollModal && trainer && studentId && (
        <EnrollmentModal
          open={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          course={course}
          trainer={trainer}
          trainerProfile={trainerProfile}
          studentId={studentId}
          hasTrialBooked={hasTrialBooked}
        />
      )}

      <Footer />
    </div>
  );
};

export default CourseDetail;
