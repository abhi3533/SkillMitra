import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const Pricing = () => {
  usePageMeta("SkillMitra Pricing — Affordable 1:1 Training", "Course fees starting ₹999/month. Trainer plans: Basic (Free), Pro (₹999), Elite (₹2,499).");
  return (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16 container mx-auto px-4 lg:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground text-center">Pricing</h1>
      <p className="mt-2 text-muted-foreground text-center">Affordable 1:1 training from industry experts</p>
      <div className="mt-12 bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-foreground">For Students</h2>
        <p className="mt-2 text-muted-foreground">Course fees are set by individual trainers. Starting from ₹999/month for personal 1:1 training.</p>
        <h2 className="text-lg font-semibold text-foreground mt-8">For Trainers</h2>
        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          {[
            { plan: "Basic", price: "Free", features: ["List courses", "Up to 5 students", "Basic profile"] },
            { plan: "Pro", price: "₹999/mo", features: ["Unlimited students", "Priority listing", "Analytics dashboard"] },
            { plan: "Elite", price: "₹2,499/mo", features: ["Featured placement", "Verified badge", "Premium support"] },
          ].map(p => (
            <div key={p.plan} className="bg-background rounded-lg border p-4">
              <h3 className="font-semibold text-foreground">{p.plan}</h3>
              <p className="text-xl font-bold text-primary mt-1">{p.price}</p>
              <ul className="mt-3 space-y-1">{p.features.map(f => <li key={f} className="text-sm text-muted-foreground">• {f}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default Pricing;
