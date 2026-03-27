import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserCheck, ShieldCheck, Languages, Lightbulb, IndianRupee, CalendarClock, Users, GraduationCap, Star, BookOpen, Mail, Clock } from "lucide-react";

const differentiators = [
  { icon: UserCheck, title: "Just You & Your Trainer", desc: "No group classes. Every session is one-on-one. Your pace, your questions, your goals." },
  { icon: ShieldCheck, title: "Verified Trainers", desc: "Every trainer goes through ID check, skill review, and a personal interview before they can teach." },
  { icon: Languages, title: "Learn in Your Language", desc: "Sessions in Telugu, Hindi, Tamil, Malayalam, Kannada, Marathi, Bengali, and English." },
  { icon: Lightbulb, title: "50+ Skills Available", desc: "Python, Data Science, UI/UX, Digital Marketing, Finance, GST, Communication, Interview Prep and more." },
  { icon: IndianRupee, title: "Money Back Guarantee", desc: "Not happy after your first session? Get a full refund within 48 hours. No questions." },
  { icon: CalendarClock, title: "Learn From Home", desc: "No commute. No fixed batch timings. Book sessions whenever it works for you." },
];

const stats = [
  { icon: Users, value: "500+", label: "Students Trained" },
  { icon: GraduationCap, value: "50+", label: "Verified Trainers" },
  { icon: Star, value: "4.8", label: "Average Rating" },
  { icon: BookOpen, value: "15+", label: "Skills Available" },
];

const About = () => {
  usePageMeta({
    title: "About SkillMitra — Personal 1:1 Skill Training for India",
    description: "SkillMitra connects students with verified trainers for affordable 1:1 skill training across India. Built by Learnvate Solutions.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "About SkillMitra",
      url: "https://skillmitra.online/about",
      mainEntity: {
        "@type": "Organization",
        name: "SkillMitra",
        legalName: "Learnvate Solutions Private Limited",
        url: "https://skillmitra.online",
        logo: "https://skillmitra.online/icons/icon-512x512.png",
        founder: { "@type": "Person", name: "Abhilash" },
        foundingLocation: { "@type": "Place", name: "Karimnagar, Telangana, India" },
        description: "India's personal 1:1 skill training platform connecting students with verified trainers.",
      },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">About SkillMitra</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">Personal 1:1 skill training for students and professionals across India</p>
        </div>
      </section>

      {/* About */}
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl space-y-5">
          <p className="text-muted-foreground leading-relaxed">SkillMitra is a platform where students and working professionals can find verified trainers for personal, one-on-one skill training — from home, in their own language, at their own pace.</p>
          <p className="text-muted-foreground leading-relaxed">We started SkillMitra because we believe everyone in India deserves access to quality training — not just people in big cities or those who can afford expensive coaching centres.</p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">Why We Built This</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">Here's the problem — millions of people in India want to learn new skills. But most online courses are pre-recorded, one-size-fits-all, and have zero accountability. Coaching institutes are expensive and only available in a few cities. YouTube is free but nobody guides you or checks your progress.</p>
          <p className="text-muted-foreground leading-relaxed">SkillMitra fixes this. We connect you directly with a verified trainer who teaches you 1:1 — in your language, at your pace, focused on your goals. Whether it's tech, design, finance, marketing, or communication — we've got trainers for it.</p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl grid md:grid-cols-2 gap-8">
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-3">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">Make quality skill training available to every Indian — no matter where they live, what language they speak, or what their budget is.</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-3">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">Become the go-to platform in India where every student finds the right trainer and every skilled professional can teach and earn.</p>
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
          <h2 className="text-2xl font-bold text-foreground mb-4">Who's Behind This</h2>
          <p className="text-muted-foreground leading-relaxed">SkillMitra was started by <span className="font-semibold text-foreground">Abhilash</span> from Karimnagar, Telangana. He saw how hard it was for students in smaller cities to get good training, and built SkillMitra to solve that problem.</p>
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
      <section className="py-10 bg-primary/5">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">Find a trainer who matches your goals, or start teaching your skills to students across India.</p>
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
