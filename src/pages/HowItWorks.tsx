import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserPlus, Search, BookOpen, Calendar, GraduationCap } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const steps = [
  { icon: UserPlus, title: "Create Your Account", desc: "Sign up as a student or trainer. Takes less than 2 minutes." },
  { icon: Search, title: "Browse Trainers", desc: "Search by skill, language, budget, or availability. Read reviews from other students." },
  { icon: BookOpen, title: "Choose a Course", desc: "Pick a course that fits your goals. Most trainers offer a free trial session." },
  { icon: Calendar, title: "Book Sessions", desc: "Pick a day and time that works for you. Get a Google Meet link for each session." },
  { icon: GraduationCap, title: "Learn & Get Certified", desc: "Attend your sessions, work on projects, and earn a verified SkillMitra certificate." },
];

const HowItWorks = () => {
  usePageMeta({
    title: "How SkillMitra Works — 5 Simple Steps",
    description: "Create an account, browse trainers, choose a course, book sessions, and start learning 1:1. It's that simple.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to Learn on SkillMitra",
      description: "5 simple steps to start personal 1:1 skill training with verified trainers",
      step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.desc })),
    },
  });
  return (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16 container mx-auto px-4 lg:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground text-center">How SkillMitra Works</h1>
      <p className="mt-2 text-muted-foreground text-center">Getting started is simple. Here's how.</p>
      <div className="mt-12 space-y-8">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <s.icon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Step {i + 1}: {s.title}</h3>
              <p className="mt-1 text-muted-foreground">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    <Footer />
  </div>
  );
};

export default HowItWorks;
