import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Star, Clock, BadgeCheck, GraduationCap, Globe, Home, Shield, IndianRupee, Award, ChevronRight, Quote, Sparkles, BookOpen, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const steps = [
  { step: "01", title: "Browse & Choose", description: "Explore verified trainers by skill, language, and budget. Read reviews and check credentials.", icon: BookOpen },
  { step: "02", title: "Book a Free Trial", description: "Schedule a free trial session to meet your trainer and experience the teaching style.", icon: Video },
  { step: "03", title: "Learn & Grow", description: "Attend 1:1 sessions from home, build projects, earn certificates, and land your dream job.", icon: Sparkles },
];

const benefits = [
  { title: "1:1 Personal Training", description: "Not group classes. Your trainer focuses only on you, tailoring every session to your pace.", icon: Users },
  { title: "In Your Language", description: "Learn in Telugu, Hindi, Tamil, English, or any language you're comfortable in.", icon: Globe },
  { title: "From Home", description: "No commuting. Attend live sessions from your room via Google Meet.", icon: Home },
  { title: "Verified Experts", description: "Every trainer is ID-verified with checked credentials and work experience.", icon: Shield },
  { title: "Affordable Pricing", description: "Starting from ₹999. Get industry-expert training at a fraction of coaching institute costs.", icon: IndianRupee },
  { title: "Earn Certificates", description: "Get SkillMitra certificates verified by QR code. Showcase on LinkedIn.", icon: Award },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => {
  const [stats, setStats] = useState({ students: 0, trainers: 0, avgRating: 0, hours: 0 });
  const [trainers, setTrainers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [studentsRes, trainersRes, sessionsRes, approvedTrainers, ratingsRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("trainers").select("id, average_rating", { count: "exact" }).eq("approval_status", "approved"),
        supabase.from("course_sessions").select("actual_duration_mins").eq("status", "completed"),
        supabase.from("trainers").select("*, profiles(*)").eq("approval_status", "approved").limit(6),
        supabase.from("ratings").select("*, students(*, profiles(*))").order("created_at", { ascending: false }).limit(3),
      ]);

      const totalHours = (sessionsRes.data || []).reduce((sum: number, s: any) => sum + (s.actual_duration_mins || 0), 0) / 60;
      const ratings = (trainersRes.data || []).filter((t: any) => t.average_rating > 0);
      const avgRating = ratings.length > 0 ? ratings.reduce((sum: number, t: any) => sum + Number(t.average_rating), 0) / ratings.length : 0;

      setStats({
        students: studentsRes.count || 0,
        trainers: trainersRes.count || 0,
        avgRating: Math.round(avgRating * 10) / 10,
        hours: Math.round(totalHours),
      });
      setTrainers(approvedTrainers.data || []);
      setReviews(ratingsRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 lg:pt-40 lg:pb-28 bg-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-foreground text-balance">
                Learn Any Skill From{" "}
                <span className="text-primary">India's Best Experts</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Personal 1:1 training in your language from verified industry experts. From home. At your pace.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/browse">
                  <Button className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold text-[15px] px-8 h-12 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto">
                    Browse Trainers <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/trainer/signup">
                  <Button variant="outline" className="border-[1.5px] border-primary text-primary hover:bg-primary/5 font-semibold text-[15px] px-8 h-12 rounded-lg w-full sm:w-auto">
                    Become a Trainer
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-medium">{stats.trainers > 0 ? `${stats.trainers} Verified Trainers` : "Verified Experts"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="font-medium">{stats.avgRating > 0 ? `${stats.avgRating} Avg Rating` : "New Platform"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium">{stats.students} Students</span>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="hidden lg:block">
              <div className="relative">
                <div className="card-elevated p-8 max-w-sm mx-auto">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Find Your Mentor</h3>
                      <p className="text-sm text-muted-foreground">1:1 Personal Training</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Python", "React", "Data Science"].map(s => (
                      <span key={s} className="text-xs px-3 py-1 rounded-full bg-primary/5 text-primary font-medium">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-sm text-muted-foreground">From ₹999/mo</span>
                    <span className="text-sm font-semibold text-primary">Explore →</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="bg-primary/[0.04] border-y border-border">
        <div className="container mx-auto px-4 lg:px-8 py-10 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Students Trained", value: stats.students.toLocaleString("en-IN") },
              { label: "Verified Trainers", value: stats.trainers.toLocaleString("en-IN") },
              { label: "Average Rating", value: stats.avgRating > 0 ? `${stats.avgRating}★` : "N/A" },
              { label: "Hours Taught", value: stats.hours.toLocaleString("en-IN") },
            ].map((stat, i) => (
              <motion.div key={stat.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-primary">{loading ? "-" : stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="label-uppercase text-primary mb-3">Simple Process</p>
            <h2 className="text-foreground">How SkillMitra Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-16">
            {steps.map((s, i) => (
              <motion.div key={s.step} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-6">
                  <s.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <p className="label-uppercase text-primary mb-2">Step {s.step}</p>
                <h3 className="text-foreground">{s.title}</h3>
                <p className="mt-3 text-muted-foreground">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Trainers — real data */}
      <section className="section-padding bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="label-uppercase text-primary mb-3">Top Trainers</p>
              <h2 className="text-foreground">Meet Our Expert Trainers</h2>
            </div>
            <Link to="/browse" className="hidden md:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {trainers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border">
              <BadgeCheck className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground mt-3">Our expert trainers are being verified. Check back soon.</p>
              <Link to="/trainer/signup"><Button className="mt-4">Become a Trainer</Button></Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainers.map((t, i) => (
                <motion.div key={t.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <Link to={`/trainer/${t.id}`} className="block group">
                    <div className="bg-white rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover hover:border-primary/20 transition-all duration-200 hover-lift relative">
                      {t.subscription_plan === "elite" && (
                        <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full gold-gradient text-accent-foreground">★ ELITE</span>
                      )}
                      <div className="flex items-start gap-4">
                        <div className="w-[72px] h-[72px] rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold text-2xl">{t.profiles?.full_name?.[0] || "T"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg font-semibold text-foreground truncate">{t.profiles?.full_name || "Trainer"}</span>
                            <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                          </div>
                          <p className="text-sm text-muted-foreground">{t.current_role || "Trainer"}</p>
                          {t.current_company && <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{t.current_company}</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {(t.skills || []).slice(0, 3).map((s: string) => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-primary/5 text-primary font-medium">{s}</span>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-accent fill-accent" />
                          <span className="text-sm font-semibold text-foreground">{Number(t.average_rating) > 0 ? t.average_rating : "New"}</span>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{t.total_students || 0} students</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why SkillMitra */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="label-uppercase text-primary mb-3">Why Choose Us</p>
            <h2 className="text-foreground">Why Students Trust SkillMitra</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={b.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="bg-white rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all duration-200 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <b.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — real data */}
      <section className="section-padding bg-primary/[0.04]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="label-uppercase text-primary mb-3">Success Stories</p>
            <h2 className="text-foreground">Students Love SkillMitra</h2>
          </div>
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border max-w-md mx-auto">
              <Quote className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground mt-3">Be our first success story. Enroll today.</p>
              <Link to="/browse"><Button className="mt-4">Browse Trainers</Button></Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((r, i) => (
                <motion.div key={r.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                  className="bg-white rounded-xl border border-border p-6 shadow-card">
                  <Quote className="w-8 h-8 text-primary/20 mb-4" />
                  <p className="text-foreground text-sm leading-relaxed">{r.student_to_trainer_review || "Great experience!"}</p>
                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(r.student_to_trainer_rating || 5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 text-accent fill-accent" />
                      ))}
                    </div>
                    <p className="font-semibold text-foreground">{r.students?.profiles?.full_name || "Student"}</p>
                    <p className="text-xs text-muted-foreground">{r.students?.profiles?.city || ""}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trainer CTA */}
      <section className="bg-primary section-padding">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-white">Start Teaching. Start Earning.</h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              Join our growing community of verified trainers. Teach from home in your own schedule.
            </p>
            <div className="mt-8">
              <Link to="/trainer/signup">
                <Button className="bg-white text-primary hover:bg-white/90 font-semibold text-[15px] px-8 h-12 rounded-lg shadow-lg">
                  Apply as Trainer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/30">Free to join • Approval within 48 hours</p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
