import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const About = () => {
  usePageMeta("About SkillMitra — India's 1:1 Skill Training Platform", "Learn about SkillMitra's mission to democratize skill training across India with verified expert trainers.");
  return (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16 container mx-auto px-4 lg:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground">About SkillMitra</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        SkillMitra is India's premier 1:1 personal skill training platform. We connect learners with verified industry experts for personalized training sessions — in their own language, from the comfort of home.
      </p>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Our mission is to democratize access to quality skill training across India, making expert mentorship affordable and accessible to every student regardless of their location.
      </p>
      <h2 className="text-xl font-semibold text-foreground mt-8">Why We Exist</h2>
      <p className="mt-2 text-muted-foreground leading-relaxed">
        Traditional coaching institutes are expensive, impersonal, and limited by geography. SkillMitra eliminates these barriers by offering live, 1:1 sessions with trainers who work at top companies — at a fraction of the cost.
      </p>
    </div>
    <Footer />
  </div>
);

export default About;
