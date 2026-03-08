import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen, Video, Sparkles } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const steps = [
  { icon: BookOpen, title: "Browse & Choose", desc: "Explore verified trainers by skill, language, and budget." },
  { icon: Video, title: "Book a Free Trial", desc: "Schedule a free trial session to meet your trainer." },
  { icon: Sparkles, title: "Learn & Grow", desc: "Attend 1:1 sessions, build projects, earn certificates." },
];

const HowItWorks = () => {
  usePageMeta("How SkillMitra Works — 3 Simple Steps", "Browse trainers, book a free trial, and learn 1:1 from verified experts in your language.");
  return (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16 container mx-auto px-4 lg:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground text-center">How SkillMitra Works</h1>
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

export default HowItWorks;
