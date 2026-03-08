import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
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





const Index = () => {
  const [realStats, setRealStats] = useState({ students: 0, trainers: 0, avgRating: 0, hours: 0 });
  const [realTrainers, setRealTrainers] = useState<any[]>([]);
  const [realReviews, setRealReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  usePageMeta("SkillMitra — Learn Any Skill From India's Best Experts", "Personal 1:1 skill training from verified industry experts. Learn React, Python, Data Science and more in your language from home.");

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
    students: realStats.students,
    trainers: realStats.trainers,
    avgRating: realStats.avgRating,
    hours: realStats.hours,
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
                  { icon: Star, text: stats.avgRating > 0 ? `${stats.avgRating} Avg Rating` : "Top Rated" },
                  { icon: Users, text: stats.students > 0 ? `${stats.students}+ Students` : "Join Now" },
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
            {[
              { value: stats.students > 0 ? `${stats.students}+` : "0", label: "Students Trained" },
              { value: stats.trainers > 0 ? `${stats.trainers}+` : "0", label: "Verified Trainers" },
              { value: stats.avgRating > 0 ? `${stats.avgRating}★` : "—", label: "Average Rating" },
              { value: stats.hours > 0 ? `${stats.hours}+` : "0", label: "Hours Taught" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-primary">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground font-medium">{s.label}</div>
              </div>
            ))}
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
          {displayTrainers && displayTrainers.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTrainers.map((t: any, i: number) => {
              const name = t.profile?.full_name || "Trainer";
              const role = t.current_role || "Trainer";
              const company = t.current_company;
              const skills = t.skills || [];
              const rating = Number(t.average_rating);
              const studentCount = t.total_students || 0;
              const plan = t.subscription_plan;
              const id = t.id;

              return (
                <motion.div key={id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <Link to={`/trainer/${t.id}`} className="block group">
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
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground mt-3">Our first batch of expert trainers is being onboarded.</p>
              <Link to="/trainer/signup"><Button className="mt-4" variant="outline">Apply as Trainer</Button></Link>
            </div>
          )}
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
