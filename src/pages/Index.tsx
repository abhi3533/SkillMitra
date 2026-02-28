import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Star, Clock, BadgeCheck, GraduationCap, Globe, Home, Shield, IndianRupee, Award, ChevronRight, Quote, Sparkles, BookOpen, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const steps = [
  { step: "01", title: "Browse & Choose", description: "Explore verified trainers by skill, language, and budget.", icon: BookOpen },
  { step: "02", title: "Book a Free Trial", description: "Schedule a free trial session to meet your trainer.", icon: Video },
  { step: "03", title: "Learn & Grow", description: "Attend 1:1 sessions, build projects, earn certificates.", icon: Sparkles },
];

const benefits = [
  { title: "1:1 Personal Training", description: "Your trainer focuses only on you, tailoring every session to your pace.", icon: Users },
  { title: "In Your Language", description: "Learn in Telugu, Hindi, Tamil, English, or any language you prefer.", icon: Globe },
  { title: "From Home", description: "No commuting. Attend live sessions via Google Meet.", icon: Home },
  { title: "Verified Experts", description: "Every trainer is ID-verified with checked credentials.", icon: Shield },
  { title: "Affordable Pricing", description: "Starting from ₹999. Expert training at a fraction of the cost.", icon: IndianRupee },
  { title: "Earn Certificates", description: "Get SkillMitra certificates verified by QR code.", icon: Award },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const demoTrainers = [
  { id: "demo-1", name: "Rahul Sharma", role: "Senior Software Engineer", company: "Google", skills: ["React", "Node.js", "System Design"], rating: 4.9, students: 85, plan: "elite" },
  { id: "demo-2", name: "Priya Patel", role: "Data Scientist", company: "Microsoft", skills: ["Python", "ML", "Data Analytics"], rating: 4.8, students: 62, plan: "pro" },
  { id: "demo-3", name: "Arjun Reddy", role: "Full Stack Developer", company: "Amazon", skills: ["Java", "AWS", "Microservices"], rating: 4.7, students: 71, plan: "elite" },
  { id: "demo-4", name: "Sneha Iyer", role: "UI/UX Designer", company: "Flipkart", skills: ["Figma", "UI Design", "Prototyping"], rating: 4.9, students: 53, plan: "pro" },
  { id: "demo-5", name: "Vikram Singh", role: "DevOps Engineer", company: "Razorpay", skills: ["Docker", "Kubernetes", "CI/CD"], rating: 4.6, students: 44, plan: "pro" },
];

const demoReviews = [
  { id: "r1", text: "Rahul sir explained React concepts so clearly that I built my first project within 2 weeks!", rating: 5, name: "Ananya M.", city: "Hyderabad", course: "React Mastery" },
  { id: "r2", text: "Priya ma'am helped me land my first data science internship. Very practical teaching.", rating: 5, name: "Karthik R.", city: "Chennai", course: "Data Science Bootcamp" },
  { id: "r3", text: "The 1:1 sessions with Arjun sir were incredibly valuable. Cleared my Amazon interview!", rating: 5, name: "Deepak K.", city: "Bangalore", course: "DSA & System Design" },
];

// Animated counter hook
function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setCount(Math.round(progress * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

const StatCounter = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl md:text-3xl font-extrabold text-primary">{count}{suffix}</div>
      <div className="mt-1 text-xs text-muted-foreground font-medium">{label}</div>
    </div>
  );
};

const Index = () => {
  const [realStats, setRealStats] = useState({ students: 0, trainers: 0, avgRating: 0, hours: 0 });
  const [realTrainers, setRealTrainers] = useState<any[]>([]);
  const [realReviews, setRealReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, trainersRes, sessionsRes] = await Promise.all([
          supabase.from("students").select("id", { count: "exact", head: true }),
          supabase.from("trainers").select("id, average_rating, user_id, skills, current_role, current_company, subscription_plan, total_students", { count: "exact" }).eq("approval_status", "approved"),
          supabase.from("course_sessions").select("actual_duration_mins").eq("status", "completed"),
        ]);

        const totalHours = (sessionsRes.data || []).reduce((sum: number, s: any) => sum + (s.actual_duration_mins || 0), 0) / 60;
        const approvedTrainers = trainersRes.data || [];
        const ratings = approvedTrainers.filter((t: any) => t.average_rating > 0);
        const avgRating = ratings.length > 0 ? ratings.reduce((sum: number, t: any) => sum + Number(t.average_rating), 0) / ratings.length : 0;

        setRealStats({
          students: studentsRes.count || 0,
          trainers: trainersRes.count || 0,
          avgRating: Math.round(avgRating * 10) / 10,
          hours: Math.round(totalHours),
        });

        if (approvedTrainers.length > 0) {
          const userIds = approvedTrainers.map((t) => t.user_id);
          const profileMap = await fetchProfilesMap(userIds);
          const enriched = approvedTrainers.slice(0, 6).map((t) => ({ ...t, profile: profileMap[t.user_id] }));
          setRealTrainers(enriched);
        }

        const { data: ratingsData } = await supabase.from("ratings").select("*").not("student_to_trainer_rating", "is", null).order("created_at", { ascending: false }).limit(5);
        if (ratingsData && ratingsData.length > 0) {
          const studentIds = ratingsData.map((r) => r.student_id);
          const { data: studentData } = await supabase.from("students").select("id, user_id").in("id", studentIds);
          const sUserIds = (studentData || []).map((s) => s.user_id);
          const sProfileMap = await fetchProfilesMap(sUserIds);
          const studentMap: Record<string, any> = {};
          (studentData || []).forEach((s) => { studentMap[s.id] = sProfileMap[s.user_id]; });
          setRealReviews(ratingsData.map((r) => ({ ...r, studentProfile: studentMap[r.student_id] })));
        }
      } catch (err) {
        console.error("Failed to fetch homepage data:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const stats = {
    students: Math.max(realStats.students, 500),
    trainers: Math.max(realStats.trainers, 100),
    avgRating: realStats.avgRating > 0 ? realStats.avgRating : 4.3,
    hours: Math.max(realStats.hours, 500),
  };

  const displayTrainers = realTrainers.length > 0 ? realTrainers : null;
  const displayReviews = realReviews.length > 0 ? realReviews : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-28 md:pb-20" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F0F7FF 100%)" }}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-[36px] md:text-[44px] lg:text-[48px] font-extrabold leading-[1.1] tracking-tight text-foreground text-balance">
                Learn Any Skill From{" "}
                <span className="text-primary">India's Best Experts</span>
              </h1>
              <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
                Personal 1:1 training in your language from verified industry experts. From home. At your pace.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link to="/browse">
                  <Button className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold text-[15px] px-8 h-11 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto">
                    Browse Trainers <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/trainer/signup">
                  <Button variant="outline" className="border-[1.5px] border-primary text-primary hover:bg-primary/5 font-semibold text-[15px] px-8 h-11 rounded-lg w-full sm:w-auto">
                    Become a Trainer
                  </Button>
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-5">
                {[
                  { icon: Shield, text: "Verified Experts" },
                  { icon: Star, text: "4.3 Avg Rating" },
                  { icon: Users, text: "500+ Students" },
                ].map((t) => (
                  <div key={t.text} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <t.icon className="w-4 h-4 text-primary" />
                    <span className="font-medium">{t.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="hidden lg:block">
              <div className="bg-white rounded-xl border border-border p-6 max-w-sm mx-auto shadow-[0_4px_24px_rgba(26,86,219,0.08)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Find Your Mentor</h3>
                    <p className="text-sm text-muted-foreground">1:1 Personal Training</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["Python", "React", "Data Science"].map((s) => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-primary/5 text-primary font-medium">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">From ₹999/mo</span>
                  <span className="text-sm font-semibold text-primary">Explore →</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="border-y border-border bg-primary/[0.03]">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {!loading ? (
              <>
                <StatCounter value={stats.students} suffix="+" label="Students Trained" />
                <StatCounter value={stats.trainers} suffix="+" label="Verified Trainers" />
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-extrabold text-primary">{stats.avgRating}★</div>
                  <div className="mt-1 text-xs text-muted-foreground font-medium">Average Rating</div>
                </div>
                <StatCounter value={stats.hours} suffix="+" label="Hours Taught" />
              </>
            ) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-8 w-16 mx-auto skeleton rounded" />
                  <div className="h-4 w-24 mx-auto mt-2 skeleton rounded" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16 border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <p className="label-uppercase text-primary mb-2">How It Works</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Three Simple Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.step} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-xs font-bold text-primary mb-1">STEP {s.step}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Trainers */}
      <section className="py-12 md:py-16 bg-card border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="label-uppercase text-primary mb-2">Top Trainers</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Meet Our Expert Trainers</h2>
            </div>
            <Link to="/browse" className="hidden md:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(displayTrainers || demoTrainers.slice(0, 6)).map((t: any, i: number) => {
              const isReal = !!t.user_id;
              const name = isReal ? t.profile?.full_name || "Trainer" : t.name;
              const role = isReal ? t.current_role || "Trainer" : t.role;
              const company = isReal ? t.current_company : t.company;
              const skills = isReal ? t.skills || [] : t.skills;
              const rating = isReal ? Number(t.average_rating) : t.rating;
              const studentCount = isReal ? t.total_students || 0 : t.students;
              const plan = isReal ? t.subscription_plan : t.plan;
              const id = isReal ? t.id : t.id;

              return (
                <motion.div key={id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <Link to={isReal ? `/trainer/${t.id}` : "/browse"} className="block group">
                    <div className="bg-white rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-[0_8px_24px_rgba(26,86,219,0.12)] transition-all duration-200 hover:-translate-y-0.5 relative">
                      {plan === "elite" && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full gold-gradient text-foreground">★ ELITE</span>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold text-xl">{name[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-foreground truncate">{name}</span>
                            <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                          </div>
                          <p className="text-sm text-muted-foreground">{role}</p>
                          {company && <span className="inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{company}</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {skills.slice(0, 3).map((s: string) => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/5 text-primary font-medium">{s}</span>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-accent fill-accent" />
                          <span className="text-sm font-semibold text-foreground">{rating > 0 ? rating : "New"}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{studentCount} students</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why SkillMitra */}
      <section className="py-12 md:py-16 border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <p className="label-uppercase text-primary mb-2">Why Choose Us</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Why Students Trust SkillMitra</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={b.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="bg-white rounded-xl border border-border p-5 hover:border-primary/20 hover:shadow-[0_8px_24px_rgba(26,86,219,0.08)] transition-all duration-200 hover:-translate-y-0.5">
                <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center mb-3">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-16 bg-[#EFF6FF] border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <p className="label-uppercase text-primary mb-2">Student Reviews</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">What Our Students Say</h2>
          </div>
          {(displayReviews || demoReviews).length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {(displayReviews || demoReviews).slice(0, 3).map((r: any, i: number) => {
                const isReal = !!r.student_id;
                const name = isReal ? r.studentProfile?.full_name || "Student" : r.name;
                const text = isReal ? r.student_review_text || "Great experience!" : r.text;
                const rating = isReal ? r.student_to_trainer_rating : r.rating;
                const course = isReal ? "" : r.course;
                const city = isReal ? r.studentProfile?.city || "" : r.city;

                return (
                  <motion.div key={r.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                    className="bg-white rounded-xl border border-border p-5 relative">
                    <Quote className="w-6 h-6 text-primary/20 absolute top-4 right-4" />
                    <div className="flex gap-0.5 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= rating ? "text-accent fill-accent" : "text-border"}`} />
                      ))}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mb-3">"{text}"</p>
                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-xs font-bold">{name[0]}</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{name}</div>
                        <div className="text-xs text-muted-foreground">{city}{course ? ` · ${course}` : ""}</div>
                      </div>
                      <BadgeCheck className="w-4 h-4 text-primary ml-auto" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Join our first batch of learners.</p>
              <Link to="/browse">
                <Button className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-lg px-6 h-10">
                  Browse Trainers
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Trainer CTA */}
      <section className="py-12 md:py-16 bg-primary">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Start Teaching. Start Earning.</h2>
            <p className="mt-3 text-base text-white/60 max-w-xl mx-auto">
              Join our growing community of verified trainers. Teach from home on your own schedule.
            </p>
            <div className="mt-6">
              <Link to="/trainer/signup">
                <Button className="bg-white text-primary hover:bg-white/90 font-semibold text-[15px] px-8 h-11 rounded-lg shadow-lg transition-all duration-200">
                  Apply as Trainer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
