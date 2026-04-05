import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SkillMitraLogo from "@/components/SkillMitraLogo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
        const role = user.user_metadata?.role || "student";

        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "email-confirmed",
            recipientEmail: user.email,
            idempotencyKey: `email-confirmed-${user.id}`,
            templateData: { name },
          },
        });

        if (role === "trainer") {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "welcome-trainer",
              recipientEmail: user.email,
              idempotencyKey: `welcome-trainer-${user.id}`,
              templateData: { name },
            },
          });
        }
      } catch (err) {
        console.error("Failed to send confirmation emails:", err);
      }
    };

    sendConfirmationEmail();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-6 sm:mb-8">
            <SkillMitraLogo darkText height={32} />
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5 sm:mb-6">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Email Verified Successfully!</h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed px-2">
            Your email has been successfully verified. You can now login to SkillMitra.
          </p>

          <div className="mt-6 sm:mt-8 space-y-3">
            <Link to="/student/login" className="block">
              <Button className="hero-gradient border-0 font-semibold w-full h-11 text-base">
                Go to Login <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/" className="block">
              <Button variant="outline" className="w-full h-11">Back to Home</Button>
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default EmailVerified;