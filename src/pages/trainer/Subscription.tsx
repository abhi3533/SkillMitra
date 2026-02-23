import { motion } from "framer-motion";
import { CreditCard, Check, Star, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Basic",
    price: "Free",
    commission: "10%",
    icon: Star,
    color: "bg-secondary",
    features: ["Standard profile listing", "Up to 5 active courses", "Basic analytics", "Email support", "10% platform commission"],
    current: true,
  },
  {
    name: "Pro",
    price: "₹999/mo",
    commission: "7%",
    icon: Zap,
    color: "hero-gradient",
    badge: "POPULAR",
    features: ["Boosted profile visibility", "Unlimited courses", "Advanced analytics", "Priority support", "7% platform commission", "Blue verified badge", "Featured in search results"],
    current: false,
  },
  {
    name: "Elite",
    price: "₹2,499/mo",
    commission: "5%",
    icon: Crown,
    color: "gold-gradient",
    badge: "BEST VALUE",
    features: ["Top of search results", "Unlimited courses", "Premium analytics", "Dedicated account manager", "5% platform commission", "Gold elite badge", "Social media feature", "Priority student matching"],
    current: false,
  },
];

const TrainerSubscription = () => {
  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-5xl mx-auto pt-16">
        <div className="text-center mb-12">
          <div className="w-14 h-14 mx-auto rounded-2xl hero-gradient flex items-center justify-center mb-4">
            <CreditCard className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Trainer Subscription Plans</h1>
          <p className="text-muted-foreground mt-2">Choose a plan that fits your teaching goals</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-card rounded-xl border p-6 relative ${plan.name === "Pro" ? "border-primary shadow-lg ring-2 ring-primary/20" : ""}`}
            >
              {plan.badge && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${plan.name === "Pro" ? "hero-gradient text-primary-foreground" : "gold-gradient text-accent-foreground"}`}>
                  {plan.badge}
                </span>
              )}
              <div className={`w-12 h-12 rounded-xl ${plan.color} flex items-center justify-center mb-4`}>
                <plan.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="text-2xl font-bold text-foreground mt-2">{plan.price}</p>
              <p className="text-sm text-accent font-medium">{plan.commission} commission</p>

              <ul className="mt-6 space-y-2">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full mt-6 ${plan.current ? "" : plan.name === "Pro" ? "hero-gradient border-0" : plan.name === "Elite" ? "gold-gradient text-accent-foreground border-0" : ""}`}
                variant={plan.current ? "outline" : "default"}
                disabled={plan.current}
              >
                {plan.current ? "Current Plan" : "Upgrade Now"}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainerSubscription;
