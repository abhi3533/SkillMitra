import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const Privacy = () => {
  usePageMeta({
    title: "Privacy Policy — SkillMitra",
    description: "Read SkillMitra's privacy policy. Learn how we collect, use, and protect your personal information.",
  });
  return (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16 container mx-auto px-4 lg:px-8 max-w-3xl prose prose-sm">
      <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="text-muted-foreground mt-4">Last updated: February 2026</p>
      <p className="text-muted-foreground mt-4">SkillMitra ("we") respects your privacy. This policy describes how we collect, use, and protect your personal information when you use our platform.</p>
      <h2 className="text-xl font-semibold text-foreground mt-6">Information We Collect</h2>
      <p className="text-muted-foreground">We collect information you provide during registration (name, email, phone), payment details processed through Razorpay, and usage data to improve our services.</p>
      <h2 className="text-xl font-semibold text-foreground mt-6">Contact</h2>
      <p className="text-muted-foreground">For privacy concerns, email us at <a href="mailto:Contact@skillmitra.online" className="text-primary">Contact@skillmitra.online</a></p>
    </div>
    <Footer />
  </div>
);

export default Privacy;
