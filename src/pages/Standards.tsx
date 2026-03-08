import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const Standards = () => {
  usePageMeta({
    title: "Certification Standards — SkillMitra",
    description: "Learn about SkillMitra's rigorous certification standards covering technical proficiency, communication, punctuality, and AI interview scoring.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Certification Standards",
      url: "https://skillmitra.online/standards",
      isPartOf: { "@type": "WebSite", name: "SkillMitra", url: "https://skillmitra.online" },
    },
  });
  return (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16 container mx-auto px-4 lg:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground">SkillMitra Certification Standards</h1>
      <p className="text-muted-foreground mt-4">Our certificates are awarded based on rigorous evaluation across multiple dimensions:</p>
      <ul className="mt-4 space-y-2 text-muted-foreground">
        <li>• <strong className="text-foreground">Technical Proficiency</strong> — Assessed by the trainer based on project work and assignments</li>
        <li>• <strong className="text-foreground">Communication Skills</strong> — Evaluated during sessions and presentations</li>
        <li>• <strong className="text-foreground">Punctuality & Attendance</strong> — Session attendance record</li>
        <li>• <strong className="text-foreground">AI Interview Score</strong> — Performance in our AI mock interview system</li>
      </ul>
      <p className="text-muted-foreground mt-4">Each certificate has a unique QR-verifiable ID that employers can check at our verification portal.</p>
    </div>
    <Footer />
  </div>
  );
};

export default Standards;
