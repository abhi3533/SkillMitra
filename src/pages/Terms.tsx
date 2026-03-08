import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const Terms = () => {
  usePageMeta({
    title: "Terms & Conditions — SkillMitra",
    description: "Read SkillMitra's terms and conditions. Understand platform fees, refund policies, and usage guidelines.",
  });
  return (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16 container mx-auto px-4 lg:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground">Terms and Conditions</h1>
      <p className="text-muted-foreground mt-4">Last updated: February 2026</p>
      <p className="text-muted-foreground mt-4">By using SkillMitra, you agree to these terms. SkillMitra is a marketplace connecting students with trainers for 1:1 skill training sessions.</p>
      <h2 className="text-xl font-semibold text-foreground mt-6">Platform Fee</h2>
      <p className="text-muted-foreground">SkillMitra charges a 10% platform commission on all course fees. Trainers receive 90% of the course fee.</p>
      <h2 className="text-xl font-semibold text-foreground mt-6">Contact</h2>
      <p className="text-muted-foreground">Questions? Email <a href="mailto:Contact@skillmitra.online" className="text-primary">Contact@skillmitra.online</a></p>
    </div>
    <Footer />
  </div>
);

export default Terms;
