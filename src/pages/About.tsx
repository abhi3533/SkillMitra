import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserCheck, ShieldCheck, Languages, Lightbulb, IndianRupee, CalendarClock, Users, GraduationCap, Star, BookOpen, Mail, Clock } from "lucide-react";

const differentiators = [
  { icon: UserCheck, title: "Personal 1:1 Training", desc: "Not group classes. Every session is dedicated to you alone. Your pace, your goals, your questions." },
  { icon: ShieldCheck, title: "Verified Expert Trainers", desc: "Every trainer is verified with document check, skill assessment, and personal interview before approval." },
  { icon: Languages, title: "Learn In Your Language", desc: "Sessions available in Telugu, Hindi, Tamil, Malayalam, Kannada, Marathi, Bengali, and English." },
  { icon: Lightbulb, title: "Any Skill, Any Goal", desc: "Python, Data Science, UI/UX, Digital Marketing, Finance, GST, Communication, Interview Prep and 50+ more skills." },
  { icon: IndianRupee, title: "Money Back Guarantee", desc: "Not satisfied after first session? Get full refund within 48 hours. Zero questions asked." },
  { icon: CalendarClock, title: "From Home, On Your Schedule", desc: "No commute. No fixed batch timings. Book sessions at times that work for you." },
];

const stats = [
  { icon: Users, value: "500+", label: "Students Trained" },
  { icon: GraduationCap, value: "50+", label: "Verified Trainers" },
  { icon: Star, value: "4.8", label: "Average Rating" },
  { icon: BookOpen, value: "15+", label: "Skills Available" },
];

const About = () => {
  usePageMeta({
    title: "About SkillMitra — India's #1 Personal 1:1 Skill Training Platform",
    description: "SkillMitra by Learnvate Solutions connects students with verified industry experts for affordable 1:1 personal skill training across India.",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">About SkillMitra</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">India's most trusted personal 1:1 skill training platform</p>
        </div>
      </section>

      {/* About */}
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl space-y-5">
          <p className="text-muted-foreground leading-relaxed">SkillMitra is India's first personal 1:1 skill training platform that connects students and working professionals with verified expert trainers for personalized, one-on-one learning — from home, in their own language, at their own pace.</p>
          <p className="text-muted-foreground leading-relaxed">We believe every person deserves access to high-quality skill training — not just those in big cities or who can afford expensive coaching institutes. SkillMitra brings verified industry experts directly to students across India through live online sessions.</p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">SkillMitra was born from a simple observation — millions of Indians want to learn new skills but struggle to find quality, affordable, personalized training. Traditional courses are theory-heavy and one-size-fits-all. Coaching institutes are expensive and limited to big cities. YouTube is free but has no accountability or personalization.</p>
          <p className="text-muted-foreground leading-relaxed">SkillMitra bridges this gap by enabling direct 1:1 mentorship from verified industry experts across any skill — technology, design, finance, marketing, communication, and more.</p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl grid md:grid-cols-2 gap-8">
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-3">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">To make high-quality personalized skill training accessible to every Indian — regardless of their city, background, or budget.</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-3">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">To become India's most trusted skill development platform — where every student finds their perfect trainer and every expert shares their knowledge.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">What Makes Us Different</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {differentiators.map((d) => (
              <Card key={d.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <d.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{d.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Numbers */}
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Our Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Team</h2>
          <p className="text-muted-foreground leading-relaxed">Founded by <span className="font-semibold text-foreground">Abhilash</span> — EdTech entrepreneur from Karimnagar, Telangana. Built SkillMitra to make quality skill training accessible to every Indian.</p>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center space-y-3">
          <p className="text-muted-foreground text-sm">SkillMitra is a product of <span className="font-semibold text-foreground">Learnvate Solutions Private Limited</span>, registered in India.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <a href="mailto:contact@skillmitra.online" className="hover:text-primary transition-colors">contact@skillmitra.online</a>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Mon–Sat, 9:00 AM–6:00 PM IST</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Start Learning?</h2>
          <p className="text-muted-foreground mb-8">Find your perfect trainer or share your expertise with students across India.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/browse">Browse Trainers</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/trainer/signup">Become a Trainer</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
