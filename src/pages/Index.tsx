import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users, Star, Clock, BadgeCheck, GraduationCap, Globe, Home, Shield, IndianRupee, Award, ChevronRight, Quote, Sparkles, BookOpen, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Placeholder Data ───────────────────────────────────────────
const trustStats = [
  { label: "Students Trained", value: "12,500+", icon: Users },
  { label: "Verified Trainers", value: "850+", icon: BadgeCheck },
  { label: "Average Rating", value: "4.8★", icon: Star },
  { label: "Hours Taught", value: "95,000+", icon: Clock },
];

const steps = [
  { step: "01", title: "Browse & Choose", description: "Explore verified trainers by skill, language, and budget. Read reviews and check credentials.", icon: BookOpen },
  { step: "02", title: "Book a Free Trial", description: "Schedule a free trial session to meet your trainer and experience the teaching style.", icon: Video },
  { step: "03", title: "Learn & Grow", description: "Attend 1:1 sessions from home, build projects, earn certificates, and land your dream job.", icon: Sparkles },
];

const trainers = [
  { id: "1", name: "Priya Sharma", role: "Senior Data Scientist", company: "Google", skills: ["Python", "ML", "Data Science"], rating: 4.9, reviews: 127, price: 2999, image: "", verified: true, elite: true },
  { id: "2", name: "Rajesh Kumar", role: "Full Stack Developer", company: "Microsoft", skills: ["React", "Node.js", "TypeScript"], rating: 4.8, reviews: 98, price: 1999, image: "", verified: true, elite: false },
  { id: "3", name: "Anitha Reddy", role: "UX Design Lead", company: "Flipkart", skills: ["Figma", "UX Research", "UI Design"], rating: 4.9, reviews: 156, price: 2499, image: "", verified: true, elite: true },
  { id: "4", name: "Vikram Patel", role: "Cloud Architect", company: "Amazon", skills: ["AWS", "DevOps", "Docker"], rating: 4.7, reviews: 85, price: 3499, image: "", verified: true, elite: false },
  { id: "5", name: "Sneha Iyer", role: "Digital Marketing Head", company: "Swiggy", skills: ["SEO", "Google Ads", "Analytics"], rating: 4.8, reviews: 112, price: 1499, image: "", verified: true, elite: false },
  { id: "6", name: "Arjun Nair", role: "Cyber Security Expert", company: "TCS", skills: ["Ethical Hacking", "Network Security"], rating: 4.9, reviews: 73, price: 2999, image: "", verified: true, elite: true },
];

const benefits = [
  { title: "1:1 Personal Training", description: "Not group classes. Your trainer focuses only on you, tailoring every session to your pace.", icon: Users, color: "primary" },
  { title: "In Your Language", description: "Learn in Telugu, Hindi, Tamil, English, or any language you're comfortable in.", icon: Globe, color: "accent" },
  { title: "From Home", description: "No commuting. Attend live sessions from your room via Google Meet.", icon: Home, color: "success" },
  { title: "Verified Experts", description: "Every trainer is ID-verified with checked credentials and work experience.", icon: Shield, color: "primary" },
  { title: "Affordable Pricing", description: "Starting from ₹999. Get industry-expert training at a fraction of coaching institute costs.", icon: IndianRupee, color: "accent" },
  { title: "Earn Certificates", description: "Get SkillMitra certificates verified by QR code. Showcase on LinkedIn.", icon: Award, color: "success" },
];

const testimonials = [
  { name: "Kavya M.", course: "Full Stack Development", trainer: "Rajesh Kumar", text: "SkillMitra changed my life. I went from knowing nothing about coding to landing a ₹8 LPA job in 3 months. My trainer was patient and taught everything in Telugu!", rating: 5, city: "Hyderabad" },
  { name: "Rohit S.", course: "Data Science", trainer: "Priya Sharma", text: "The 1:1 attention is unbeatable. My trainer from Google taught me real-world projects. I cracked interviews at 3 companies. Worth every rupee.", rating: 5, city: "Pune" },
  { name: "Meera K.", course: "Digital Marketing", trainer: "Sneha Iyer", text: "I was a housewife wanting to restart my career. SkillMitra helped me learn digital marketing in Hindi. Now I freelance and earn ₹40,000/month!", rating: 5, city: "Jaipur" },
];

// ─── Page Component ─────────────────────────────────────────────
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsla(38,92%,50%,0.08),transparent_60%)]" />
        <div className="container mx-auto px-4 lg:px-8 pt-32 pb-20 lg:pt-40 lg:pb-28 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-primary-foreground/80">India's #1 Personal Skill Training Platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight text-balance">
              Learn Any Skill.<br />From Home.<br />From <span className="text-accent">India's Best.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-primary-foreground/70 max-w-2xl leading-relaxed">
              Personal 1:1 training in your language from verified industry experts. No group classes. No recordings. Real mentorship.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/browse">
                <Button size="lg" className="gold-gradient text-accent-foreground font-semibold text-base px-8 h-13 shadow-lg hover:shadow-xl transition-all border-0 w-full sm:w-auto">
                  Browse Trainers <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/trainer/signup">
                <Button size="lg" variant="outline" className="bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold text-base px-8 h-13 w-full sm:w-auto">
                  Become a Trainer
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Trust Stats Bar */}
        <div className="bg-primary-foreground/5 border-t border-primary-foreground/10">
          <div className="container mx-auto px-4 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trustStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <stat.icon className="w-8 h-8 text-accent flex-shrink-0" />
                  <div>
                    <div className="text-xl lg:text-2xl font-bold text-primary-foreground">{stat.value}</div>
                    <div className="text-xs text-primary-foreground/50 font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Simple Process</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-foreground">How SkillMitra Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl hero-gradient flex items-center justify-center mb-6">
                  <s.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <span className="text-xs font-bold text-accent uppercase tracking-widest">Step {s.step}</span>
                <h3 className="mt-2 text-xl font-bold text-foreground">{s.title}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Trainers */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-sm font-semibold text-accent uppercase tracking-wider">Top Trainers</span>
              <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-foreground">Learn from Industry Experts</h2>
            </div>
            <Link to="/browse" className="hidden md:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainers.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link to={`/trainer/${t.id}`} className="block group">
                  <div className="bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl hero-gradient flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground font-bold text-lg">{t.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate">{t.name}</h3>
                          {t.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                          {t.elite && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded gold-gradient text-accent-foreground">ELITE</span>}
                        </div>
                        <p className="text-sm text-muted-foreground">{t.role}</p>
                        <p className="text-xs text-accent font-medium mt-0.5">{t.company}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {t.skills.map(s => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">{s}</span>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-accent fill-accent" />
                        <span className="text-sm font-semibold text-foreground">{t.rating}</span>
                        <span className="text-xs text-muted-foreground">({t.reviews})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">From</span>
                        <span className="ml-1 text-lg font-bold text-foreground">₹{t.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/browse">
              <Button variant="outline" className="font-semibold">View All Trainers <ChevronRight className="ml-1 w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why SkillMitra */}
      <section className="py-20 lg:py-28 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Why Choose Us</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-foreground">Why 12,500+ Students Trust SkillMitra</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  b.color === "primary" ? "hero-gradient" : b.color === "accent" ? "gold-gradient" : "bg-success"
                }`}>
                  <b.icon className={`w-6 h-6 ${b.color === "accent" ? "text-accent-foreground" : "text-primary-foreground"}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Success Stories</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-foreground">Students Love SkillMitra</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <Quote className="w-8 h-8 text-accent/30 mb-4" />
                <p className="text-foreground leading-relaxed text-sm">{t.text}</p>
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

      {/* Trainer CTA */}
      <section className="hero-gradient py-20 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground">Are You an Industry Expert?</h2>
            <p className="mt-4 text-lg text-primary-foreground/70 max-w-2xl mx-auto">
              Join 850+ verified trainers earning ₹50,000–₹2,00,000/month teaching skills you already have. Teach from home in your own schedule.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/trainer/signup">
                <Button size="lg" className="gold-gradient text-accent-foreground font-semibold text-base px-8 h-13 shadow-lg border-0">
                  Apply as Trainer <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-primary-foreground/40">Free to join • Approval within 48 hours</p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
