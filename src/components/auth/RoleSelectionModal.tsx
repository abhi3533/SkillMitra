import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface RoleSelectionModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName: string;
}

const RoleSelectionModal = ({ open, onClose, userId, userEmail, userName }: RoleSelectionModalProps) => {
  const [loading, setLoading] = useState<"student" | "trainer" | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRoleSelect = async (role: "student" | "trainer") => {
    setLoading(role);
    try {
      // Insert role
      await supabase.from("user_roles").insert({ user_id: userId, role });

      // Create profile if not exists
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
      if (!existingProfile) {
        await supabase.from("profiles").insert({
          id: userId,
          full_name: userName,
          email: userEmail,
        });
      }

      if (role === "student") {
        const referralCode = 'SM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase.from("students").insert({
          user_id: userId,
          referral_code: referralCode,
          trainer_gender_preference: "no_preference",
        });
        toast({ title: "Welcome to SkillMitra! 🎉", description: "Your student account is ready.", variant: "success" });
        navigate("/student/dashboard");
      } else {
        const referralCode = 'TM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase.from("trainers").insert({
          user_id: userId,
          referral_code: referralCode,
        });
        toast({ title: "Welcome, Trainer! 🎉", description: "Let's complete your profile.", variant: "success" });
        // Redirect to trainer signup step 2 (skills) — we pass a query param
        navigate("/trainer/dashboard");
      }
      onClose();
    } catch (err: any) {
      console.error("Role selection error:", err);
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 gap-0 [&>button]:hidden" onPointerDownOutside={e => e.preventDefault()}>
        <div className="p-6 text-center">
          <img src="/skillmitra-logo.png" alt="SkillMitra" className="h-8 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">Welcome to SkillMitra!</h2>
          <p className="text-sm text-muted-foreground mt-2">How would you like to use SkillMitra?</p>
        </div>

        <div className="px-6 pb-6 grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleSelect("student")}
            disabled={!!loading}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary bg-background hover:bg-primary/5 transition-all disabled:opacity-50"
          >
            {loading === "student" ? (
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">I'm a Student</p>
              <p className="text-xs text-muted-foreground mt-1">Learn from expert trainers</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleSelect("trainer")}
            disabled={!!loading}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-accent bg-background hover:bg-accent/5 transition-all disabled:opacity-50"
          >
            {loading === "trainer" ? (
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-accent" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">I'm a Trainer</p>
              <p className="text-xs text-muted-foreground mt-1">Teach & earn from home</p>
            </div>
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionModal;
