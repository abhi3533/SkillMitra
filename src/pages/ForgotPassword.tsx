import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SkillMitraLogo from "@/components/SkillMitraLogo";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RESET_REDIRECTS = {
  admin: "https://skillmitra.online/reset-password?role=admin",
  trainer: "https://skillmitra.online/reset-password?role=trainer",
  student: "https://skillmitra.online/reset-password?role=student",
} as const;

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "student";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [emailError, setEmailError] = useState("");
  const { toast } = useToast();

  const loginPath = role === "admin" ? "/admin/login" : role === "trainer" ? "/trainer/login" : "/student/login";

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError("Email is required");
      return false;
    }
    if (!EMAIL_REGEX.test(value.trim())) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotFound(false);
    setEmailError("");

    if (!validateEmail(email)) return;

    setLoading(true);
    try {
      // Add 10s timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out. Please try again.")), 10000)
      );

      // Check if email exists in database
      const checkPromise = supabase.functions.invoke("check-email-exists", {
        body: { email: email.trim().toLowerCase() },
      });

      const { data } = await Promise.race([checkPromise, timeoutPromise]) as any;

      if (!data?.exists) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Email exists — send reset link with timeout
      const resetPromise = supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: PASSWORD_RESET_REDIRECTS[role as keyof typeof PASSWORD_RESET_REDIRECTS] ?? PASSWORD_RESET_REDIRECTS.student,
      });

      const { error } = await Promise.race([resetPromise, timeoutPromise]) as any;
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setNotFound(false);
    setEmail("");
    setEmailError("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <SkillMitraLogo darkText height={32} />
        </div>

        <div className="bg-card rounded-xl border p-4 sm:p-6 space-y-5">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">Check your email</h1>
              <p className="text-sm text-muted-foreground px-1">
                We've sent a password reset link to <span className="font-medium text-foreground break-all">{email}</span>.
                The link expires in 1 hour.
              </p>
              <Link to={loginPath} className="inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </div>
          ) : notFound ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7 text-destructive" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">No account found</h1>
              <p className="text-sm text-destructive px-1">
                No account found with this email address. Please check your email or sign up for free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={handleTryAgain} className="gap-1 w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4" /> Try Again
                </Button>
                <Link to="/student/signup" className="block">
                  <Button className="hero-gradient border-0 font-semibold w-full sm:w-auto">Sign Up Free</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Forgot Password</h1>
                <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send you a reset link.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    placeholder="you@example.com"
                    className={`mt-1.5 h-11 ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    required
                  />
                  {emailError && (
                    <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {emailError}
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 hero-gradient font-semibold border-0">
                  {loading ? "Checking..." : "Send Reset Link"}
                </Button>
              </form>
              <Link to={loginPath} className="inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
