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
      // Check if email exists in database
      const { data } = await supabase.functions.invoke("check-email-exists", {
        body: { email: email.trim().toLowerCase() },
      });

      if (!data?.exists) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Email exists — send reset link
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password?role=${role}`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send reset email", variant: "destructive" });
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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <SkillMitraLogo darkText height={32} />
        </div>

        <div className="bg-card rounded-xl border p-6 space-y-5">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
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
              <h1 className="text-xl font-bold text-foreground">No account found</h1>
              <p className="text-sm text-destructive">
                No account found with this email address. Please check your email or sign up for free.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleTryAgain} className="gap-1">
                  <ArrowLeft className="w-4 h-4" /> Try Again
                </Button>
                <Link to="/student/signup">
                  <Button className="hero-gradient border-0 font-semibold">Sign Up Free</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold text-foreground">Forgot Password</h1>
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
                      <AlertCircle className="w-3.5 h-3.5" /> {emailError}
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
