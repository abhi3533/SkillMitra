import { Link } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Users, Star, Clock, BadgeCheck, GraduationCap, Globe, Home, Shield,
  IndianRupee, Award, ChevronRight, Quote, Sparkles, BookOpen, Video, TrendingUp, Zap, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { demoTrainers, demoTestimonials, demoStats } from "@/lib/demoData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ─── Scroll-triggered section wrapper ─── */
const ScrollReveal = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Typing effect ─── */
const TypingText = ({ texts }: { texts: string[] }) => {
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const current = texts[index];

  useEffect(() => {
    const speed = deleting ? 30 : 60;
    const timer = setTimeout(() => {
      if (!deleting && charIndex < current.length) {
        setCharIndex(c => c + 1);
      } else if (!deleting && charIndex === current.length) {
        setTimeout(() => setDeleting(true), 1800);
      } else if (deleting && charIndex > 0) {
        setCharIndex(c => c - 1);
      } else {
        setDeleting(false);
        setIndex(i => (i + 1) % texts.length);
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [charIndex, deleting, current, texts]);

  return (
    <span>
      {current.slice(0, charIndex)}
      <span className="inline-block w-[2px] h-[1.1em] bg-primary align-middle animate-pulse ml-0.5" />
    </span>
  );
};

/* ─── Count-up hook ─── */
const useCountUp = (end: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
};

/* ─── Steps data ─── */
const steps = [
  { num: "01", title: "Browse & Choose", desc: "Explore verified trainers by skill, language, and budget. Find the perfect match.", icon: BookOpen },
  { num: "02", title: "Book a Free Trial", desc: "Schedule a free 1:1 trial session. Meet your trainer, no commitment.", icon: Video },
  { num: "03", title: "Learn & Grow", desc: "Attend live sessions, build real projects, earn verified certificates.", icon: Sparkles },
];

const benefits = [
  { title: "1:1 Personal Training", desc: "Your trainer focuses only on you, tailoring every session to your pace.", icon: Users },
  { title: "In Your Language", desc: "Learn in Telugu, Hindi, Tamil, English, or any language you prefer.", icon: Globe },
  { title: "From Home", desc: "No commuting. Attend live sessions via Google Meet from anywhere.", icon: Home },
  { title: "Verified Experts", desc: "Every trainer is ID-verified with checked credentials & work history.", icon: Shield },
  { title: "Affordable Pricing", desc: "Starting from ₹999/month. Expert training at a fraction of the cost.", icon: IndianRupee },
  { title: "Earn Certificates", desc: "Get SkillMitra certificates verified by QR code — share on LinkedIn.", icon: Award },
];

const statItems = [
  { value: demoStats.students, suffix: "+", label: "Students Enrolled", icon: Users },
  { value: demoStats.trainers, suffix: "+", label: "Expert Trainers", icon: GraduationCap },
  { value: 48, suffix: "★", label: "Average Rating", icon: Star, isRating: true },
  { value: demoStats.successRate, suffix: "%", label: "Success Rate", icon: TrendingUp },
  { value: demoStats.sessions, suffix: "+", label: "Sessions Done", icon: Clock },
  { value: demoStats.skills, suffix: "+", label: "Skills Available", icon: Zap },
];

const StatItem = ({ item }: { item: typeof statItems[number] }) => {
  const { count, ref } = useCountUp(item.isRating ? 48 : item.value);
  return (
    <div className="text-center" ref={ref}>
      <div className="w-10 h-10 rounded-xl bg-primary/[0.08] flex items-center justify-center mx-auto mb-2">
        <item.icon className="w-5 h-5 text-primary" />
      </div>
      <div className="text-2xl md:text-3xl font-extrabold text-foreground">
        {item.isRating ? `${(count / 10).toFixed(1)}★` : `${count}${item.suffix}`}
      </div>
      <div className="mt-1 text-xs text-muted-foreground font-medium">{item.label}</div>
    </div>
  );
};

  const [realTrainers, setRealTrainers] = useState<any[]>([]);
  const [realReviews, setRealReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  usePageMeta("SkillMitra — Learn Any Skill From India's Best Experts", "Personal 1:1 skill training from verified industry experts. Learn React, Python, Data Science and more in your language from home.");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trainersRes = await supabase.from("trainers").select("id, average_rating, user_id, skills, current_role, current_company, subscription_plan, total_students").eq("approval_status", "approved");
        const approvedTrainers = trainersRes.data || [];
        if (approvedTrainers.length > 0) {
          const userIds = approvedTrainers.map(t => t.user_id);
          const profileMap = await fetchProfilesMap(userIds);
          setRealTrainers(approvedTrainers.slice(0, 6).map(t => ({ ...t, profile: profileMap[t.user_id] })));
        }
        const { data: ratingsData } = await supabase.from("ratings").select("*").not("student_to_trainer_rating", "is", null).order("created_at", { ascending: false }).limit(5);
        if (ratingsData && ratingsData.length > 0) {
          const studentIds = ratingsData.map(r => r.student_id);
          const { data: studentData } = await supabase.from("students").select("id, user_id").in("id", studentIds);
          const sUserIds = (studentData || []).map(s => s.user_id);
          const sProfileMap = await fetchProfilesMap(sUserIds);
          const studentMap: Record<string, any> = {};
          (studentData || []).forEach(s => { studentMap[s.id] = sProfileMap[s.user_id]; });
          setRealReviews(ratingsData.map(r => ({ ...r, studentProfile: studentMap[r.student_id] })));
        }
      } catch (err) { console.error("Failed to fetch homepage data:", err); }
      setLoading(false);
    };
    fetchData();
  }, []);

  const displayTrainers = realTrainers.length >= 6 ? realTrainers : [...realTrainers, ...demoTrainers.slice(0, 6 - realTrainers.length)];
  const displayReviews = realReviews.length >= 4 ? realReviews.slice(0, 4) : [...realReviews, ...demoTestimonials.slice(0, 4 - realReviews.length)];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ════════════════════════════════ HERO ════════════════════════════════ */}
      <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(221 79% 49% / 0.07), transparent 70%), linear-gradient(180deg, hsl(210 40% 98%) 0%, hsl(0 0% 100%) 100%)"
        }} />
        {/* Floating dots */}
        <div className="absolute top-20 left-[10%] w-2 h-2 rounded-full bg-primary/20 animate-pulse" />
        <div className="absolute top-40 right-[15%] w-3 h-3 rounded-full bg-accent/30 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-[20%] w-2 h-2 rounded-full bg-primary/15 animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.07] border border-primary/10 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary tracking-wide">India's #1 Skill Training Platform</span>
              </div>

              <h1 className="text-[36px] md:text-[48px] lg:text-[56px] font-extrabold leading-[1.08] tracking-tight">
                <span className="bg-gradient-to-r from-primary via-[hsl(221,79%,40%)] to-primary bg-clip-text text-transparent">
                  Skill
                </span>
                <span className="text-foreground">Mitra</span>
                <br />
                <span className="text-foreground">Learn Any Skill From</span>
                <br />
                <span className="text-primary">India's Best Experts</span>
              </h1>

              <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                <TypingText texts={[
                  "Personal 1:1 training from verified industry experts.",
                  "Learn in your own language, from home.",
                  "Starting from just ₹999/month.",
                  "Earn certificates. Get placed."
                ]} />
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/browse">
                  <Button className="group relative bg-primary hover:bg-primary text-primary-foreground font-semibold text-[15px] px-8 h-12 rounded-xl shadow-[0_4px_16px_hsl(221_79%_49%/0.3)] hover:shadow-[0_8px_32px_hsl(221_79%_49%/0.45)] transition-all duration-300 w-full sm:w-auto overflow-hidden">
                    <span className="relative z-10 flex items-center">Browse Trainers <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-[hsl(221,79%,38%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </Link>
                <Link to="/trainer/signup">
                  <Button variant="outline" className="border-[1.5px] border-primary/30 text-primary hover:bg-primary/5 hover:border-primary font-semibold text-[15px] px-8 h-12 rounded-xl transition-all duration-300 w-full sm:w-auto">
                    Become a Trainer
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-6">
                {[
                  { icon: Shield, text: "Verified Experts" },
                  { icon: Star, text: "4.8★ Avg Rating" },
                  { icon: Users, text: "500+ Students" },
                ].map(t => (
                  <div key={t.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-7 h-7 rounded-lg bg-primary/[0.07] flex items-center justify-center">
                      <t.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="font-medium">{t.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — Floating trainer card */}
            <motion.div
              initial={{ opacity: 0, x: 40, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                {/* Glow behind card */}
                <div className="absolute inset-0 rounded-2xl blur-3xl bg-primary/[0.08] scale-105" />

                <div className="relative bg-background rounded-2xl border border-border p-7 max-w-sm mx-auto shadow-[0_8px_40px_rgba(26,86,219,0.12)]">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Find Your Mentor</h3>
                      <p className="text-sm text-muted-foreground">1:1 Personal Training</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Python", "React", "Data Science", "UI/UX"].map(s => (
                      <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-primary/[0.06] text-primary font-medium border border-primary/10">{s}</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex -space-x-2">
                      {["RK", "PS", "MI"].map((init, i) => (
                        <div key={init} className="w-8 h-8 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center" style={{ zIndex: 3 - i }}>
                          <span className="text-[10px] font-bold text-primary">{init}</span>
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">50+ trainers online</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <span className="text-xs text-muted-foreground">Starting from</span>
                      <div className="text-lg font-bold text-foreground">₹999<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    </div>
                    <Link to="/browse">
                      <Button size="sm" className="hero-gradient text-primary-foreground font-semibold rounded-lg shadow-sm hover:shadow-md">
                        Explore <ArrowRight className="ml-1 w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Floating badge */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -top-3 -right-3 bg-background rounded-xl border border-border px-3 py-2 shadow-lg flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <BadgeCheck className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Verified</span>
                </motion.div>

                {/* Floating rating */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-2 -left-4 bg-background rounded-xl border border-border px-3 py-2 shadow-lg flex items-center gap-2"
                >
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  <span className="text-sm font-bold text-foreground">4.8</span>
                  <span className="text-xs text-muted-foreground">rating</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════ STATS BAR ════════════════════════════ */}
      <section className="relative py-8 md:py-10" style={{ background: "linear-gradient(135deg, hsl(210 50% 96%) 0%, hsl(221 79% 97%) 100%)" }}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
            {statItems.map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 0.05}>
                <StatItem item={s} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ HOW IT WORKS ════════════════════════ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.15em] text-primary bg-primary/[0.06] px-4 py-1.5 rounded-full mb-4">How It Works</span>
              <h2 className="text-2xl md:text-[36px] font-bold text-foreground">Three Simple Steps</h2>
              <p className="mt-3 text-muted-foreground max-w-md mx-auto">Get started in minutes. No commitments. No hidden fees.</p>
            </div>
          </ScrollReveal>

          <div className="relative max-w-4xl mx-auto">
            {/* Connecting dotted line */}
            <div className="hidden md:block absolute top-[56px] left-[16.67%] right-[16.67%] h-[2px] border-t-2 border-dashed border-primary/20" />

            <div className="grid md:grid-cols-3 gap-8 md:gap-6">
              {steps.map((s, i) => (
                <ScrollReveal key={s.num} delay={i * 0.12}>
                  <div className="text-center relative">
                    {/* Number circle */}
                    <div className="relative z-10 w-[72px] h-[72px] rounded-full mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-primary to-[hsl(221,79%,38%)] shadow-[0_4px_20px_hsl(221_79%_49%/0.3)]">
                      <span className="text-2xl font-extrabold text-primary-foreground">{s.num}</span>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-primary/[0.06] flex items-center justify-center mx-auto mb-4">
                      <s.icon className="w-5 h-5 text-primary" />
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mx-auto">{s.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ FEATURED TRAINERS ════════════════════ */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-[0.15em] text-primary bg-primary/[0.06] px-4 py-1.5 rounded-full mb-4">Top Trainers</span>
                <h2 className="text-2xl md:text-[36px] font-bold text-foreground">Meet Our Expert Trainers</h2>
              </div>
              <Link to="/browse" className="hidden md:flex items-center gap-1 text-sm font-semibold text-primary hover:text-[hsl(221,79%,38%)] transition-colors group">
                View all <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTrainers.map((t: any, i: number) => {
              const name = t.profile?.full_name || "Trainer";
              const role = t.current_role || "Trainer";
              const company = t.current_company;
              const skills = t.skills || [];
              const rating = Number(t.average_rating);
              const studentCount = t.total_students || 0;
              const plan = t.subscription_plan;
              const avatarColor = t.avatarColor || "hsl(221 79% 49%)";

              return (
                <ScrollReveal key={t.id} delay={i * 0.08}>
                  <div className="group bg-background rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-[0_12px_40px_rgba(26,86,219,0.14)] transition-all duration-300 hover:-translate-y-1.5 relative">
                    {plan === "elite" && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full gold-gradient text-foreground">★ ELITE</span>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${avatarColor}12` }}>
                        <span className="font-bold text-xl" style={{ color: avatarColor }}>{name[0]}{name.split(" ")[1]?.[0] || ""}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground truncate">{name}</span>
                          <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                        </div>
                        <p className="text-sm text-muted-foreground">{role}</p>
                        {company && <span className="inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{company}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {skills.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-xs px-2.5 py-0.5 rounded-full bg-primary/[0.06] text-primary font-medium border border-primary/10">{s}</span>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "text-accent fill-accent" : "text-border"}`} />
                          ))}
                        </div>
                        <span className="text-sm font-bold text-foreground">{rating > 0 ? rating : "New"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{studentCount} students</span>
                    </div>

                    {/* Book Trial button — revealed on hover */}
                    <div className="mt-3">
                      <Link to={`/trainer/${t.id}`}>
                        <Button size="sm" className="w-full hero-gradient text-primary-foreground font-semibold rounded-lg opacity-80 group-hover:opacity-100 transition-opacity">
                          <Play className="w-3 h-3 mr-1.5" /> Book Free Trial
                        </Button>
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link to="/browse">
              <Button variant="outline" className="border-primary text-primary rounded-xl">View All Trainers <ChevronRight className="ml-1 w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════ WHY SKILLMITRA ════════════════════ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.15em] text-primary bg-primary/[0.06] px-4 py-1.5 rounded-full mb-4">Why Choose Us</span>
              <h2 className="text-2xl md:text-[36px] font-bold text-foreground">Why Students Trust SkillMitra</h2>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <ScrollReveal key={b.title} delay={i * 0.06}>
                <div className="group bg-background rounded-2xl border border-border p-6 hover:border-primary/20 hover:shadow-[0_12px_40px_rgba(26,86,219,0.1)] transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-primary/[0.07] flex items-center justify-center mb-4 group-hover:bg-primary/[0.12] transition-colors">
                    <b.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">{b.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ TESTIMONIALS ════════════════════ */}
      <section className="py-16 md:py-24" style={{ background: "linear-gradient(135deg, hsl(210 50% 96%) 0%, hsl(221 79% 97%) 100%)" }}>
        <div className="container mx-auto px-4 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.15em] text-primary bg-primary/[0.06] px-4 py-1.5 rounded-full mb-4">Student Reviews</span>
              <h2 className="text-2xl md:text-[36px] font-bold text-foreground">What Our Students Say</h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayReviews.map((r: any, i: number) => {
              const isDemo = !!r.name;
              const name = isDemo ? r.name : (r.studentProfile?.full_name || "Student");
              const text = isDemo ? r.text : (r.student_review_text || "Great experience!");
              const rating = isDemo ? r.rating : (r.student_to_trainer_rating || 5);
              const city = isDemo ? r.city : (r.studentProfile?.city || "");
              const course = isDemo ? r.course : "";

              return (
                <ScrollReveal key={r.id} delay={i * 0.08}>
                  <div className="bg-background rounded-2xl border border-border p-6 relative hover:shadow-[0_8px_32px_rgba(26,86,219,0.1)] transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                    {/* Large quote marks */}
                    <div className="absolute top-5 right-5">
                      <Quote className="w-10 h-10 text-primary/[0.08]" />
                    </div>

                    {/* Stars */}
                    <div className="flex gap-0.5 mb-4">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= rating ? "text-accent fill-accent" : "text-border"}`} />
                      ))}
                    </div>

                    <p className="text-sm text-foreground leading-relaxed mb-4 flex-1">"{text}"</p>

                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-sm font-bold">{name[0]}{name.split(" ")[1]?.[0] || ""}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{name}</div>
                        <div className="text-xs text-muted-foreground truncate">{city}{course ? ` · ${course}` : ""}</div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════ CTA ════════════════════ */}
      <section className="relative py-20 md:py-28 overflow-hidden" style={{
        background: "linear-gradient(135deg, hsl(221 79% 49%) 0%, hsl(221 79% 30%) 100%)"
      }}>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-[10%] w-40 h-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-[10%] w-60 h-60 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-3xl md:text-[44px] font-extrabold text-white leading-tight">
              Start Teaching. Start Earning.
            </h2>
            <p className="mt-4 text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
              Join our growing community of verified trainers. Teach from home on your own schedule. Earn up to ₹50,000/month.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/trainer/signup">
                <Button className="bg-white text-primary hover:bg-white/90 font-bold text-[15px] px-10 h-12 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-300">
                  Apply as Trainer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/browse">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold text-[15px] px-10 h-12 rounded-xl transition-all duration-300">
                  Browse Trainers
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
