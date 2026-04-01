import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SkillMitraLogo from "@/components/SkillMitraLogo";
import { supabase } from "@/integrations/supabase/client";

const EmailVerified = () => {
  const emailSentRef = useRef(false);

  useEffect(() => {
    if (emailSentRef.current) return;
    emailSentRef.current = true;

    const sendConfirmationEmail = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;

        const name = user.user_metadata?.full_name || "";

        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "email-confirmed",
            recipientEmail: user.email,
            idempotencyKey: `email-confirmed-${user.id}`,
            templateData: { name },
          },
        });
      } catch (err) {
        console.error("Failed to send email-confirmed email:", err);
      }
    };

    sendConfirmationEmail();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center"
      >
        <div className="mb-8">
          <SkillMitraLogo darkText height={32} />
        </div>

        <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>

        <h1 className="text-2xl font-bold text-foreground">Email Verified Successfully!</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Your email has been successfully verified. You can now login to SkillMitra.
        </p>

        <div className="mt-8 space-y-3">
          <Link to="/student/login">
            <Button className="hero-gradient border-0 font-semibold w-full h-11 text-base">
              Go to Login <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full">Back to Home</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerified;
