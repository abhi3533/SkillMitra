import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const TrainerThankYou = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-6">
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md text-center">
      <div className="w-20 h-20 mx-auto rounded-full hero-gradient flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Application Submitted!</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Your application has been submitted successfully. Our team will review and respond within <span className="font-semibold text-foreground">24 hours</span>.
      </p>
      <div className="mt-6 p-4 rounded-xl bg-gold-light border border-accent/20">
        <div className="flex items-center gap-2 justify-center">
          <Clock className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-foreground">Expected review time: 24–48 hours</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">You'll receive an email notification once your profile is approved.</p>
      <div className="mt-8">
        <Link to="/">
          <Button className="hero-gradient border-0 font-semibold">Back to Home <ArrowRight className="ml-2 w-4 h-4" /></Button>
        </Link>
      </div>
    </motion.div>
  </div>
);

export default TrainerThankYou;
