import { Link } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Users, Star, Clock, BadgeCheck, GraduationCap, Globe, Home, Shield,
  IndianRupee, Award, ChevronRight, Quote, Sparkles, BookOpen, Video, TrendingUp, Zap, Play, ArrowUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { demoTrainers, demoTestimonials, demoStats } from "@/lib/demoData";
import { blogPosts as recentBlogPosts, categoryIcons as blogCategoryIcons } from "@/lib/blogData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrainerCardSkeleton from "@/components/TrainerCardSkeleton";

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
  { num: "01", title: "Pick a Trainer", desc: "Search by skill, language, or budget. Find someone who fits your learning style.", icon: BookOpen },
  { num: "02", title: "Try a Free Session", desc: "Book a free 1:1 trial. Meet your trainer, ask questions — no payment needed.", icon: Video },
  { num: "03", title: "Start Learning", desc: "Attend live sessions, work on real projects, and get a verified certificate.", icon: Sparkles },
];

const benefits = [
  { title: "Just You & Your Trainer", desc: "No group classes. Every session is focused only on you and your goals.", icon: Users },
  { title: "Learn in Your Language", desc: "Sessions in Telugu, Hindi, Tamil, English, and more. Learn comfortably.", icon: Globe },
  { title: "Learn From Home", desc: "No travel, no fixed batch times. Join live sessions on Google Meet from anywhere.", icon: Home },
  { title: "Verified Trainers", desc: "Every trainer goes through ID check and profile review before they can teach.", icon: Shield },
  { title: "Starts at ₹999", desc: "Quality 1:1 training at prices that won't break the bank. Seriously.", icon: IndianRupee },
  { title: "Get Certified", desc: "Earn a SkillMitra certificate with QR verification. Add it to your LinkedIn.", icon: Award },
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

const heroTrainers = [
  { name: "Rajesh Kumar", role: "Senior Software Engineer", company: "TCS, Hyderabad", color: "#1A56DB", skills: ["Python", "Data Science", "Machine Learning"], rating: 4.9, students: 45, fee: 2999, elite: true },
  { name: "Priya Sharma", role: "UI/UX Designer", company: "Infosys, Bangalore", color: "#7C3AED", skills: ["Figma", "Adobe XD", "UI Design", "Web Design"], rating: 4.8, students: 32, fee: 1999, elite: false },
  { name: "Mohammed Irfan", role: "Full Stack Developer", company: "Wipro, Chennai", color: "#059669", skills: ["React", "Node.js", "JavaScript", "MongoDB"], rating: 4.7, students: 28, fee: 2499, elite: false },
  { name: "Sneha Reddy", role: "Digital Marketing Expert", company: "Startup, Hyderabad", color: "#EA580C", skills: ["SEO", "Social Media", "Google Ads", "Content Marketing"], rating: 4.9, students: 51, fee: 1499, elite: true },
  { name: "Arjun Nair", role: "CA & Finance Trainer", company: "Independent, Kerala", color: "#DC2626", skills: ["Accounting", "Tally", "GST", "Financial Planning"], rating: 4.8, students: 38, fee: 1799, elite: false },
  { name: "Divya Menon", role: "Communication & Soft Skills Trainer", company: "Independent, Mumbai", color: "#0D9488", skills: ["Public Speaking", "Interview Prep", "Business English"], rating: 4.9, students: 62, fee: 999, elite: true },
];

const Index = () => {
  const [realTrainers, setRealTrainers] = useState<any[]>([]);
  const [realReviews, setRealReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrainer, setActiveTrainer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTrainer(prev => (prev + 1) % heroTrainers.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  usePageMeta({
    title: "SkillMitra — Learn Real Skills From Working Professionals",
    description: "Find verified trainers for 1:1 personal skill training in Python, Data Science, UI/UX, Digital Marketing and more. Starting ₹999.",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "SkillMitra",
      url: "https://skillmitra.online",
      logo: "https://skillmitra.online/icons/icon-512x512.png",
      description: "India's personal 1:1 skill training platform",
      contactPoint: { "@type": "ContactPoint", email: "contact@skillmitra.online", contactType: "customer service" },
      sameAs: ["https://linkedin.com/company/skillmitra", "https://twitter.com/skillmitra", "https://instagram.com/skillmitra"],
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: rpcTrainers } = await supabase.rpc("get_approved_trainers_list");
        const approvedTrainers = (rpcTrainers || []).map((t: any) => ({
          id: t.trainer_id, user_id: t.trainer_user_id, average_rating: t.trainer_average_rating,
          skills: t.trainer_skills, current_role: t.trainer_current_role,
          current_company: t.trainer_current_company, subscription_plan: t.trainer_subscription_plan,
          total_students: t.trainer_total_students,
        }));
        if (approvedTrainers.length > 0) {
          const userIds = approvedTrainers.map((t: any) => t.user_id);
          const { data: profileData } = await supabase.rpc("get_public_profiles_bulk", { profile_ids: userIds });
          const profileMap: Record<string, any> = {};
          (profileData || []).forEach((p: any) => {
            profileMap[p.p_id] = { id: p.p_id, full_name: p.p_full_name, city: p.p_city, state: p.p_state, profile_picture_url: p.p_profile_picture_url, is_verified: p.p_is_verified, gender: p.p_gender };
          });
          setRealTrainers(approvedTrainers.slice(0, 6).map((t: any) => ({ ...t, profile: profileMap[t.user_id] })));
        }
        const { data: ratingsData } = await supabase.from("ratings").select("id, student_id, trainer_id, student_to_trainer_rating, student_to_trainer_review, student_review_text, student_rated_at, created_at, enrollment_id").not("student_to_trainer_rating", "is", null).order("created_at", { ascending: false }).limit(5);
        if (ratingsData && ratingsData.length > 0) {
          const studentIds = ratingsData.map(r => r.student_id);
          const { data: studentData } = await supabase.from("students").select("id, user_id").in("id", studentIds);
          const sUserIds = (studentData || []).map(s => s.user_id);
          const { data: sProfileData } = await supabase.rpc("get_public_profiles_bulk", { profile_ids: sUserIds });
          const sProfileMap: Record<string, any> = {};
          (sProfileData || []).forEach((p: any) => {
            sProfileMap[p.p_id] = { id: p.p_id, full_name: p.p_full_name, city: p.p_city, profile_picture_url: p.p_profile_picture_url };
          });
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
  // Only show real reviews that have meaningful content (name + review text)
  const qualityReviews = realReviews.filter(r => r.studentProfile?.full_name && r.student_review_text && r.student_to_trainer_rating);
  const displayReviews = qualityReviews.length >= 4 ? qualityReviews.slice(0, 4) : [...qualityReviews, ...demoTestimonials.slice(0, 4 - qualityReviews.length)];

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
                <span className="text-xs font-semibold text-primary tracking-wide">1:1 Skill Training — Verified Trainers Across India</span>
              </div>

              <h1 className="text-[36px] md:text-[48px] lg:text-[56px] font-extrabold leading-[1.08] tracking-tight">
                <span className="text-foreground">Learn Real Skills</span>
                <br />
                <span className="text-foreground">From </span>
                <span className="bg-gradient-to-r from-primary via-[hsl(221,79%,40%)] to-primary bg-clip-text text-transparent">
                  Working Professionals
                </span>
              </h1>

              <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                <TypingText texts={[
                  "1:1 training with verified industry experts.",
                  "Learn in your language, from home.",
                  "Courses starting at just ₹999.",
                  "Build projects. Get certified. Get hired."
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
                  { icon: Star, text: "4.8★ Average Rating" },
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

                {/* Rotating trainer card */}
                <div className="relative max-w-sm mx-auto">
                  <AnimatePresence mode="wait">
                    {(() => {
                      const t = heroTrainers[activeTrainer];
                      const initials = t.name.split(" ").map(n => n[0]).join("");
                      return (
                        <motion.div
                          key={activeTrainer}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="bg-background rounded-2xl border border-border shadow-[0_8px_40px_rgba(26,86,219,0.12)] overflow-hidden"
                        >
                          <div className="p-6">
                            <div className="flex items-start gap-3.5">
                              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${t.color}15` }}>
                                <span className="text-lg font-bold" style={{ color: t.color }}>{initials}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-semibold text-foreground text-[15px]">{t.name}</h3>
                                  <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                                  {t.elite && <span className="text-[9px] font-bold px-2 py-0.5 rounded gold-gradient text-accent-foreground ml-auto">ELITE</span>}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                                <p className="text-xs font-medium mt-0.5" style={{ color: t.color }}>{t.company}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-4">
                              {t.skills.slice(0, 4).map(s => (
                                <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">{s}</span>
                              ))}
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">Starting from <span className="font-semibold text-foreground">₹{t.fee.toLocaleString()}</span> per course</p>
                          </div>
                          <div className="px-6 py-3.5 border-t border-border flex items-center justify-between bg-secondary/30">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-accent fill-accent" />
                                <span className="text-sm font-semibold text-foreground">{t.rating}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{t.students} students</span>
                            </div>
                            <Link to="/browse">
                              <Button size="sm" className="hero-gradient text-primary-foreground font-semibold rounded-lg text-xs h-8 px-4 shadow-sm hover:shadow-md">
                                Book Free Trial
                              </Button>
                            </Link>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                  {/* Dot indicators */}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    {heroTrainers.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveTrainer(i)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${i === activeTrainer ? "bg-primary scale-125" : "bg-border hover:bg-muted-foreground/40"}`}
                      />
                    ))}
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
              <h2 className="text-2xl md:text-[36px] font-bold text-foreground">How It Works</h2>
              <p className="mt-3 text-muted-foreground max-w-md mx-auto">Start learning in 3 simple steps. No commitments, no hidden charges.</p>
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
                <h2 className="text-2xl md:text-[36px] font-bold text-foreground">Our Top Trainers</h2>
              </div>
              <Link to="/browse" className="hidden md:flex items-center gap-1 text-sm font-semibold text-primary hover:text-[hsl(221,79%,38%)] transition-colors group">
                View all <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <TrainerCardSkeleton key={i} />)}
            </div>
          ) : (
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
                      <Link to={`/trainer/${t.slug || t.id}`}>
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
          )}

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
              <span className="inline-block text-xs font-bold uppercase tracking-[0.15em] text-primary bg-primary/[0.06] px-4 py-1.5 rounded-full mb-4">Why SkillMitra</span>
              <h2 className="text-2xl md:text-[36px] font-bold text-foreground">Why Students Choose Us</h2>
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
              const text = isDemo ? r.text : (r.student_review_text || "Excellent training experience!");
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
              Got Skills? Start Teaching.
            </h2>
            <p className="mt-4 text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
              Teach students across India from home, on your own schedule. Trainers on SkillMitra earn up to ₹50,000/month.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/trainer/signup">
                <Button className="bg-white text-primary hover:bg-white/90 font-bold text-[15px] px-10 h-12 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-300">
                  Apply as Trainer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/browse">
                <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:border-white/60 font-semibold text-[15px] px-10 h-12 rounded-xl transition-all duration-300 bg-transparent">
                  Browse Trainers
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

/* ─── Scroll-to-top button ─── */
const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default Index;
