import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Star, BadgeCheck, Zap, Globe, MessageSquare, Briefcase, ChevronRight, BookOpen, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5 } }),
};

const demoTrainers = [
  { id: "demo-1", name: "Rahul Sharma", role: "Senior Software Engineer", company: "Google", skills: ["React", "Node.js", "System Design"], rating: 4.9, students: 85 },
  { id: "demo-2", name: "Priya Patel", role: "Data Scientist", company: "Microsoft", skills: ["Python", "ML", "Data Analytics"], rating: 4.8, students: 62 },
  { id: "demo-3", name: "Arjun Reddy", role: "Full Stack Developer", company: "Amazon", skills: ["Java", "AWS", "Microservices"], rating: 4.7, students: 71 },
  { id: "demo-4", name: "Sneha Iyer", role: "UI/UX Designer", company: "Flipkart", skills: ["Figma", "UI Design", "Prototyping"], rating: 4.9, students: 53 },
];

const features = [
  { icon: Zap, title: "AI Learning Paths", description: "Adaptive learning trajectories that adjust to your pace, strengths, and career goals in real time." },
  { icon: MessageSquare, title: "Live 1-on-1 Mentorship", description: "Real sessions with real engineers. Not pre-recorded. Not group classes. Just you and your mentor." },
  { icon: Globe, title: "Learn in Your Language", description: "Telugu, Hindi, Tamil, Kannada, or English. Learn in the language you think in." },
  { icon: Briefcase, title: "Placement Support", description: "Resume reviews, mock interviews, and referrals from your mentor's professional network." },
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
        setRealStats({ students: studentsRes.count || 0, trainers: trainersRes.count || 0, technologies: allSkills.size });
        if (approvedTrainers.length > 0) {
          const userIds = approvedTrainers.map(t => t.user_id);
          const profileMap = await fetchProfilesMap(userIds);
          setRealTrainers(approvedTrainers.slice(0, 4).map(t => ({ ...t, profile: profileMap[t.user_id] })));
        }
      } catch (err) { console.error("Failed to fetch homepage data:", err); }
      setLoading(false);
    };
    fetchData();
  }, []);

  const stats = {
    students: `${Math.max(realStats.students, 1000)}+`,
    trainers: `${Math.max(realStats.trainers, 100)}+`,
    technologies: `${Math.max(realStats.technologies, 25)}+`,
  };
  const displayTrainers = realTrainers.length > 0 ? realTrainers : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ───── Hero ───── */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 lg:pt-44 lg:pb-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-foreground text-balance">
                Personalized software training.{" "}
                <span className="text-primary">Built for real careers.</span>
              </h1>
              <p className="mt-6 text-[18px] md:text-[20px] text-muted-foreground max-w-lg" style={{ lineHeight: 1.7 }}>
                Learn directly from industry engineers with AI-guided learning paths and 1-on-1 mentorship.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Link to="/student/signup">
                  <Button className="bg-primary text-white font-semibold text-[15px] px-7 h-12 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 w-full sm:w-auto">
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/browse">
                  <Button variant="outline" className="border-border text-foreground hover:bg-muted font-medium text-[15px] px-7 h-12 rounded-xl w-full sm:w-auto transition-all duration-200">
                    Browse Trainers
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Product Mockup */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="hidden lg:block">
              <div className="bg-white rounded-2xl border border-border shadow-[0_24px_80px_rgba(0,0,0,0.06)] overflow-hidden">
                {/* Titlebar */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-card/50">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  </div>
                  <span className="ml-3 text-[11px] text-muted-foreground font-medium tracking-wide">dashboard — skillmitra</span>
                </div>
                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Stat row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Sessions", value: "12", icon: BookOpen, color: "text-primary" },
                      { label: "Hours", value: "36", icon: Clock, color: "text-success" },
                      { label: "Progress", value: "78%", icon: TrendingUp, color: "text-foreground" },
                    ].map(s => (
                      <div key={s.label} className="bg-card rounded-xl p-3.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                          <span className="text-[11px] text-muted-foreground">{s.label}</span>
                        </div>
                        <span className="text-[22px] font-bold text-foreground tracking-tight">{s.value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Course card */}
                  <div className="bg-card rounded-xl p-4 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">React Advanced Patterns</p>
                      <p className="text-[11px] text-muted-foreground">Next session — Today 4:00 PM</p>
                    </div>
                    <div className="text-[11px] font-medium text-primary bg-primary/5 px-2.5 py-1 rounded-md">Join</div>
                  </div>
                  {/* Trainer */}
                  <div className="bg-card rounded-xl p-4 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center flex-shrink-0 text-[14px] font-bold text-foreground">
                      RS
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">Rahul Sharma</p>
                      <p className="text-[11px] text-muted-foreground">Sr. Engineer, Google · 4.9 ★</p>
                    </div>
                    <div className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md">Profile</div>
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span>Course Progress</span>
                      <span className="font-medium text-foreground">78%</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: "78%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───── Trust ───── */}
      <section className="border-t border-border/60">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <p className="text-center text-[14px] text-muted-foreground mb-12 tracking-wide">
            Trusted by India's next generation of engineers
          </p>
          <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto">
            {[
              { label: "Students", value: stats.students },
              { label: "Trainers", value: stats.trainers },
              { label: "Technologies", value: stats.technologies },
            ].map((s, i) => (
              <motion.div key={s.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
                <div className="text-[32px] md:text-[40px] font-bold tracking-tight text-foreground">{loading ? "—" : s.value}</div>
                <div className="mt-1 text-[13px] text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section className="py-24 md:py-32 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-foreground">How it works</h2>
            <p className="mt-4 text-[17px] text-muted-foreground max-w-md mx-auto">Three simple steps to start your career growth.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-10 max-w-3xl mx-auto">
            {[
              { n: "01", title: "Choose your trainer", desc: "Browse verified engineers. Check skills, ratings, and experience. Book a free trial." },
              { n: "02", title: "Learn live 1-on-1", desc: "Attend personalized sessions from home. Build real projects with expert guidance." },
              { n: "03", title: "Become job ready", desc: "Ace AI mock interviews, build your resume, earn verified certificates." },
            ].map((s, i) => (
              <motion.div key={s.n} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
                <span className="text-[40px] font-extrabold text-border">{s.n}</span>
                <h3 className="mt-2 text-foreground text-[18px]">{s.title}</h3>
                <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Trainers ───── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-foreground">Meet our trainers</h2>
              <p className="mt-3 text-[17px] text-muted-foreground">Engineers from top companies, ready to mentor you.</p>
            </div>
            <Link to="/browse" className="hidden md:flex items-center gap-1 text-[14px] font-medium text-primary hover:underline">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(displayTrainers || demoTrainers).map((t: any, i: number) => {
              const isReal = !!t.user_id;
              const name = isReal ? t.profile?.full_name || "Trainer" : t.name;
              const role = isReal ? t.current_role || "Trainer" : t.role;
              const company = isReal ? t.current_company : t.company;
              const skills = isReal ? (t.skills || []) : t.skills;
              const rating = isReal ? Number(t.average_rating) : t.rating;
              const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2);

              return (
                <motion.div key={t.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <Link to={isReal ? `/trainer/${t.id}` : "/browse"} className="block group">
                    <div className="bg-white rounded-2xl border border-border p-5 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl bg-card flex items-center justify-center flex-shrink-0 text-[13px] font-bold text-foreground border border-border">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[14px] font-semibold text-foreground truncate">{name}</span>
                            <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          </div>
                          <p className="text-[12px] text-muted-foreground truncate">{role}</p>
                        </div>
                      </div>
                      {company && (
                        <span className="inline-block text-[11px] px-2 py-0.5 rounded-md bg-card text-muted-foreground font-medium border border-border/60 mb-3">
                          {company}
                        </span>
                      )}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {skills.slice(0, 2).map((s: string) => (
                          <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-primary/5 text-primary font-medium">{s}</span>
                        ))}
                        {skills.length > 2 && <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">+{skills.length - 2}</span>}
                      </div>
                      <div className="pt-3 border-t border-border/60 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />
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

      {/* ───── Features ───── */}
      <section className="py-24 md:py-32 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-foreground">Everything you need to grow</h2>
            <p className="mt-4 text-[17px] text-muted-foreground max-w-md mx-auto">Built for serious learners who want real career outcomes.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {features.map((f, i) => (
              <motion.div key={f.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="bg-white p-6 rounded-2xl border border-border transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-[17px] font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="py-28 md:py-36">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className="text-foreground text-balance">Start building your future today</h2>
            <p className="mt-4 text-[17px] text-muted-foreground max-w-md mx-auto">
              Join thousands of students learning from India's best engineers.
            </p>
            <div className="mt-10">
              <Link to="/student/signup">
                <Button className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-[15px] px-8 h-12 rounded-xl hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200">
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
