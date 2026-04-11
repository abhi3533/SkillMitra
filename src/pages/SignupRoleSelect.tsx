import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen } from "lucide-react";
import SkillMitraLogo from "@/components/SkillMitraLogo";

const SignupRoleSelect = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <SkillMitraLogo darkText height={36} className="mx-auto mb-8" />
        <h1 className="text-2xl font-bold text-foreground">Join SkillMitra</h1>
        <p className="text-muted-foreground mt-2 mb-8">How would you like to sign up?</p>

        <div className="grid grid-cols-2 gap-4">
          <Link to="/student/signup">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary bg-background hover:bg-primary/5 transition-all cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Student</p>
                <p className="text-xs text-muted-foreground mt-1">Learn from experts</p>
              </div>
            </motion.div>
          </Link>

          <Link to="/trainer/signup">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-accent bg-background hover:bg-accent/5 transition-all cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Trainer</p>
                <p className="text-xs text-muted-foreground mt-1">Teach & earn</p>
              </div>
            </motion.div>
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignupRoleSelect;
