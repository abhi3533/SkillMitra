import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users, Star, Clock, BadgeCheck, GraduationCap, Globe, Home, Shield, IndianRupee, Award, ChevronRight, Quote, Sparkles, BookOpen, Video, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const trustStats = [
  { label: "Students Trained", value: "12,500+", icon: Users },
  { label: "Verified Trainers", value: "850+", icon: BadgeCheck },
  { label: "Average Rating", value: "4.9★", icon: Star },
  { label: "Hours Taught", value: "95,000+", icon: Clock },
];

const steps = [
  { step: "01", title: "Browse & Choose", description: "Explore verified trainers by skill, language, and budget. Read reviews and check credentials.", icon: BookOpen },
  { step: "02", title: "Book a Free Trial", description: "Schedule a free trial session to meet your trainer and experience the teaching style.", icon: Video },
  { step: "03", title: "Learn & Grow", description: "Attend 1:1 sessions from home, build projects, earn certificates, and land your dream job.", icon: Sparkles },
];

const trainers = [
  { id: "1", name: "Priya Sharma", role: "Senior Data Scientist", company: "Google", skills: ["Python", "ML", "Data Science"], rating: 4.9, reviews: 127, price: 2999, verified: true, elite: true },
  { id: "2", name: "Rajesh Kumar", role: "Full Stack Developer", company: "Microsoft", skills: ["React", "Node.js", "TypeScript"], rating: 4.8, reviews: 98, price: 1999, verified: true, elite: false },
  { id: "3", name: "Anitha Reddy", role: "UX Design Lead", company: "Flipkart", skills: ["Figma", "UX Research", "UI Design"], rating: 4.9, reviews: 156, price: 2499, verified: true, elite: true },
  { id: "4", name: "Vikram Patel", role: "Cloud Architect", company: "Amazon", skills: ["AWS", "DevOps", "Docker"], rating: 4.7, reviews: 85, price: 3499, verified: true, elite: false },
  { id: "5", name: "Sneha Iyer", role: "Digital Marketing Head", company: "Swiggy", skills: ["SEO", "Google Ads", "Analytics"], rating: 4.8, reviews: 112, price: 1499, verified: true, elite: false },
  { id: "6", name: "Arjun Nair", role: "Cyber Security Expert", company: "TCS", skills: ["Ethical Hacking", "Network Security"], rating: 4.9, reviews: 73, price: 2999, verified: true, elite: true },
];

const benefits = [
  { title: "1:1 Personal Training", description: "Not group classes. Your trainer focuses only on you, tailoring every session to your pace.", icon: Users },
  { title: "In Your Language", description: "Learn in Telugu, Hindi, Tamil, English, or any language you're comfortable in.", icon: Globe },
  { title: "From Home", description: "No commuting. Attend live sessions from your room via Google Meet.", icon: Home },
  { title: "Verified Experts", description: "Every trainer is ID-verified with checked credentials and work experience.", icon: Shield },
  { title: "Affordable Pricing", description: "Starting from ₹999. Get industry-expert training at a fraction of coaching institute costs.", icon: IndianRupee },
  { title: "Earn Certificates", description: "Get SkillMitra certificates verified by QR code. Showcase on LinkedIn.", icon: Award },
];

const testimonials = [
  { name: "Kavya M.", course: "Full Stack Development", trainer: "Rajesh Kumar", text: "SkillMitra changed my life. I went from knowing nothing about coding to landing a ₹8 LPA job in 3 months. My trainer was patient and taught everything in Telugu!", rating: 5, city: "Hyderabad" },
  { name: "Rohit S.", course: "Data Science", trainer: "Priya Sharma", text: "The 1:1 attention is unbeatable. My trainer from Google taught me real-world projects. I cracked interviews at 3 companies. Worth every rupee.", rating: 5, city: "Pune" },
  { name: "Meera K.", course: "Digital Marketing", trainer: "Sneha Iyer", text: "I was a housewife wanting to restart my career. SkillMitra helped me learn digital marketing in Hindi. Now I freelance and earn ₹40,000/month!", rating: 5, city: "Jaipur" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ═══ Hero — white bg, text left, mockup right ═══ */}
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
              {/* Trust signals */}
              <div className="mt-8 flex flex-wrap gap-6">
                {[
                  { icon: Shield, text: "Verified Experts" },
                  { icon: Star, text: "4.9 Avg Rating" },
                  { icon: Users, text: "12,500+ Students" },
                ].map(s => (
                  <div key={s.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <s.icon className="w-4 h-4 text-primary" />
                    <span className="font-medium">{s.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right side — floating trainer card mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="card-elevated p-8 max-w-sm mx-auto">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-2xl">P</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">Priya Sharma</h3>
                        <BadgeCheck className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">Senior Data Scientist</p>
                      <p className="text-xs text-primary font-medium">Google</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Python", "ML", "Data Science"].map(s => (
                      <span key={s} className="text-xs px-3 py-1 rounded-full bg-primary/5 text-primary font-medium">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="text-sm font-semibold">4.9</span>
                      <span className="text-xs text-muted-foreground">(127 reviews)</span>
                    </div>
                    <span className="font-bold text-foreground">₹2,999/mo</span>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full gold-gradient text-xs font-bold text-accent-foreground shadow-lg">
                  ★ ELITE
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ Trust Stats Bar ═══ */}
      <section className="bg-primary/[0.04] border-y border-border">
        <div className="container mx-auto px-4 lg:px-8 py-10 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustStats.map((stat, i) => (
              <motion.div key={stat.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="label-uppercase text-primary mb-3">Simple Process</p>
            <h2 className="text-foreground">How SkillMitra Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-16">
            {steps.map((s, i) => (
              <motion.div key={s.step} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="text-center">
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

      {/* ═══ Featured Trainers ═══ */}
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainers.map((t, i) => (
              <motion.div key={t.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Link to={`/trainer/${t.id}`} className="block group">
                  <div className="bg-white rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover hover:border-primary/20 transition-all duration-200 hover-lift relative">
                    {t.elite && (
                      <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full gold-gradient text-accent-foreground">
                        ★ ELITE
                      </span>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="w-[72px] h-[72px] rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-2xl">{t.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg font-semibold text-foreground truncate">{t.name}</span>
                          {t.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{t.role}</p>
                        <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{t.company}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {t.skills.slice(0, 3).map(s => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-primary/5 text-primary font-medium">{s}</span>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-accent fill-accent" />
                        <span className="text-sm font-semibold text-foreground">{t.rating}</span>
                        <span className="text-xs text-muted-foreground">({t.reviews})</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">From </span>
                        <span className="text-base font-semibold text-primary">₹{t.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/browse">
              <Button variant="outline" className="font-semibold border-primary text-primary">View All Trainers <ChevronRight className="ml-1 w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Why SkillMitra ═══ */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="label-uppercase text-primary mb-3">Why Choose Us</p>
            <h2 className="text-foreground">Why 12,500+ Students Trust SkillMitra</h2>
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

      {/* ═══ Testimonials ═══ */}
      <section className="section-padding bg-primary/[0.04]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <p className="label-uppercase text-primary mb-3">Success Stories</p>
            <h2 className="text-foreground">Students Love SkillMitra</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="bg-white rounded-xl border border-border p-6 shadow-card">
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                <p className="text-foreground text-sm leading-relaxed">{t.text}</p>
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-accent fill-accent" />
                    ))}
                  </div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.course} • {t.city}</p>
                  <p className="text-xs text-primary font-medium mt-1">Trained by {t.trainer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Trainer CTA ═══ */}
      <section className="bg-primary section-padding">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-white">Start Teaching. Start Earning.</h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              Join 850+ verified trainers earning ₹50,000–₹2,00,000/month teaching skills you already have. Teach from home in your own schedule.
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
