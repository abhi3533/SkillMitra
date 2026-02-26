import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Star, BadgeCheck, Zap, Globe, BookOpen, MessageSquare, Briefcase, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6 } }),
};

const demoTrainers = [
  { id: "demo-1", name: "Rahul Sharma", role: "Senior Software Engineer", company: "Google", skills: ["React", "Node.js", "System Design"], rating: 4.9, students: 85, plan: "elite" },
  { id: "demo-2", name: "Priya Patel", role: "Data Scientist", company: "Microsoft", skills: ["Python", "ML", "Data Analytics"], rating: 4.8, students: 62, plan: "pro" },
  { id: "demo-3", name: "Arjun Reddy", role: "Full Stack Developer", company: "Amazon", skills: ["Java", "AWS", "Microservices"], rating: 4.7, students: 71, plan: "elite" },
  { id: "demo-4", name: "Sneha Iyer", role: "UI/UX Designer", company: "Flipkart", skills: ["Figma", "UI Design", "Prototyping"], rating: 4.9, students: 53, plan: "pro" },
];

const features = [
  { icon: Zap, title: "AI Learning Paths", description: "Personalized learning trajectories powered by AI that adapt to your pace, strengths, and career goals." },
  { icon: MessageSquare, title: "1-on-1 Mentorship", description: "Live sessions with real engineers from top companies. Not pre-recorded videos — real human interaction." },
  { icon: Globe, title: "Native Language Learning", description: "Learn in Telugu, Hindi, Tamil, or English. Your language, your comfort, your growth." },
  { icon: Briefcase, title: "Placement Support", description: "Resume building, mock interviews, and direct referrals from your trainer's professional network." },
];

const Index = () => {
  const [realStats, setRealStats] = useState({ students: 0, trainers: 0, technologies: 0 });
  const [realTrainers, setRealTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, trainersRes] = await Promise.all([
          supabase.from("students").select("id", { count: "exact", head: true }),
          supabase.from("trainers").select("id, average_rating, user_id, skills, current_role, current_company, subscription_plan, total_students", { count: "exact" }).eq("approval_status", "approved"),
        ]);

        const approvedTrainers = trainersRes.data || [];
        const allSkills = new Set(approvedTrainers.flatMap((t: any) => t.skills || []));

        setRealStats({
          students: studentsRes.count || 0,
          trainers: trainersRes.count || 0,
          technologies: allSkills.size,
        });

        if (approvedTrainers.length > 0) {
          const userIds = approvedTrainers.map(t => t.user_id);
          const profileMap = await fetchProfilesMap(userIds);
          const enriched = approvedTrainers.slice(0, 4).map(t => ({ ...t, profile: profileMap[t.user_id] }));
          setRealTrainers(enriched);
        }
      } catch (err) {
        console.error("Failed to fetch homepage data:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const displayStats = {
    students: `${Math.max(realStats.students, 1000)}+`,
    trainers: `${Math.max(realStats.trainers, 100)}+`,
    technologies: `${Math.max(realStats.technologies, 25)}+`,
  };

  const displayTrainers = realTrainers.length > 0 ? realTrainers : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 lg:pt-48 lg:pb-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(221_83%_53%/0.08),transparent)]" />
        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <h1 className="text-foreground text-balance">
                Personalized software training.{" "}
                <span className="text-gradient">Built for real careers.</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-lg leading-[1.7]">
                Learn directly from industry engineers with AI-guided learning paths and 1-on-1 mentorship.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Link to="/student/signup">
                  <Button className="hero-gradient text-white font-semibold text-[16px] px-8 h-13 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 w-full sm:w-auto">
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/browse">
                  <Button variant="outline" className="border border-border text-foreground hover:bg-muted font-semibold text-[16px] px-8 h-13 rounded-xl w-full sm:w-auto">
                    Browse Trainers
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="hidden lg:block">
              <div className="relative">
                {/* Dashboard Mockup */}
                <div className="bg-white rounded-2xl border border-border shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-6 max-w-md mx-auto">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-accent/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                    <div className="flex-1" />
                    <span className="text-[11px] text-muted-foreground font-medium">SkillMitra Dashboard</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-card">
                      <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center"><BookOpen className="w-5 h-5 text-white" /></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Next Session</p>
                        <p className="text-xs text-muted-foreground">React Advanced — Today 4:00 PM</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-card">
                      <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center"><Zap className="w-5 h-5 text-success" /></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">AI Score</p>
                        <p className="text-xs text-muted-foreground">87% — Ready for interviews</p>
                      </div>
                    </div>
                    <div className="h-24 rounded-xl bg-card flex items-end px-4 pb-3 gap-1.5">
                      {[40, 55, 45, 65, 70, 85, 90].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-md hero-gradient" style={{ height: `${h}%`, opacity: 0.15 + (i * 0.12) }} />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl border border-border shadow-lg px-4 py-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-gold fill-gold" />
                  <span className="text-sm font-semibold text-foreground">4.9</span>
                  <span className="text-xs text-muted-foreground">avg rating</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="border-y border-border/50">
        <div className="container mx-auto px-4 lg:px-8 py-14">
          <p className="text-center text-[15px] text-muted-foreground font-medium mb-10">Trusted by India's next generation of engineers</p>
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { label: "Students", value: displayStats.students },
              { label: "Trainers", value: displayStats.trainers },
              { label: "Technologies", value: displayStats.technologies },
            ].map((stat, i) => (
              <motion.div key={stat.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
                <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">{loading ? "—" : stat.value}</div>
                <div className="mt-2 text-[14px] text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16 lg:mb-20">
            <p className="label-uppercase text-primary mb-3">How It Works</p>
            <h2 className="text-foreground">Three steps to career growth</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Choose your trainer", desc: "Browse verified engineers by skill, experience, and language. Book a free trial." },
              { step: "02", title: "Learn live 1-on-1", desc: "Attend personalized live sessions. Build real projects with expert guidance." },
              { step: "03", title: "Become job ready", desc: "Ace AI mock interviews, build your resume, and earn verified certificates." },
            ].map((s, i) => (
              <motion.div key={s.step} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="text-center p-8 rounded-2xl border border-transparent hover:border-border hover:bg-card transition-all duration-300">
                <span className="text-5xl font-extrabold text-gradient">{s.step}</span>
                <h3 className="mt-4 text-foreground">{s.title}</h3>
                <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trainer Showcase */}
      <section className="section-padding bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between mb-12 lg:mb-16">
            <div>
              <p className="label-uppercase text-primary mb-3">Expert Trainers</p>
              <h2 className="text-foreground">Learn from the best</h2>
            </div>
            <Link to="/browse" className="hidden md:flex items-center gap-1 text-[15px] font-semibold text-primary hover:underline transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(displayTrainers || demoTrainers).map((t: any, i: number) => {
              const isReal = !!t.user_id;
              const name = isReal ? t.profile?.full_name || "Trainer" : t.name;
              const role = isReal ? t.current_role || "Trainer" : t.role;
              const company = isReal ? t.current_company : t.company;
              const skills = isReal ? (t.skills || []) : t.skills;
              const rating = isReal ? Number(t.average_rating) : t.rating;

              return (
                <motion.div key={t.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <Link to={isReal ? `/trainer/${t.id}` : "/browse"} className="block group">
                    <div className="bg-white rounded-2xl border border-border p-5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover-lift">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl hero-gradient flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">{name[0]}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[15px] font-semibold text-foreground truncate">{name}</span>
                            <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          </div>
                          <p className="text-[13px] text-muted-foreground truncate">{role}</p>
                        </div>
                      </div>
                      {company && <span className="inline-block text-[12px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium mb-3">{company}</span>}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {skills.slice(0, 2).map((s: string) => (
                          <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-primary/5 text-primary font-medium">{s}</span>
                        ))}
                        {skills.length > 2 && <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">+{skills.length - 2}</span>}
                      </div>
                      <div className="pt-3 border-t border-border flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                        <span className="text-[13px] font-semibold text-foreground">{rating > 0 ? rating : "New"}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16 lg:mb-20">
            <p className="label-uppercase text-primary mb-3">Platform Features</p>
            <h2 className="text-foreground">Everything you need to grow</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {features.map((f, i) => (
              <motion.div key={f.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="p-7 rounded-2xl border border-border hover:border-primary/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300 group">
                <div className="w-11 h-11 rounded-xl hero-gradient flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-foreground">{f.title}</h3>
                <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_120%,hsl(221_83%_53%/0.06),transparent)]" />
        <div className="container mx-auto px-4 lg:px-8 text-center relative">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="text-foreground text-balance">Start building your future today</h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Join thousands of students already learning from India's best engineers.
            </p>
            <div className="mt-10">
              <Link to="/student/signup">
                <Button className="hero-gradient text-white font-semibold text-[16px] px-10 h-14 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300">
                  Create Free Account <ArrowRight className="ml-2 w-4 h-4" />
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
