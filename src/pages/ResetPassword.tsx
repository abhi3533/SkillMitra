import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PasswordStrengthIndicator, { isPasswordValid } from "@/components/auth/PasswordStrengthIndicator";
import SkillMitraLogo from "@/components/SkillMitraLogo";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "student";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expired, setExpired] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loginPath = role === "admin" ? "/admin/login" : role === "trainer" ? "/trainer/login" : "/student/login";

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      } else {
        // Listen for recovery event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === "PASSWORD_RECOVERY") {
            setHasSession(true);
          }
        });
        // If no session after 3 seconds, likely expired
        setTimeout(() => {
          if (!hasSession) setExpired(true);
        }, 3000);
        return () => subscription.unsubscribe();
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      toast({ title: "Password doesn't meet requirements", variant: "warning" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      setSuccess(true);
      setTimeout(() => navigate(loginPath), 3000);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <SkillMitraLogo darkText height={32} />
        </div>

        <div className="bg-card rounded-xl border p-6 space-y-5">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Password Reset Successful!</h1>
              <p className="text-sm text-muted-foreground">Redirecting you to login...</p>
              <Link to={loginPath} className="text-sm text-primary font-semibold hover:underline">Go to login</Link>
            </div>
          ) : expired && !hasSession ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Link Expired</h1>
              <p className="text-sm text-muted-foreground">This reset link has expired or is invalid. Please request a new one.</p>
              <Link to={`/forgot-password?role=${role}`} className="inline-block text-sm text-primary font-semibold hover:underline">
                Request new reset link
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold text-foreground">Set New Password</h1>
                <p className="text-sm text-muted-foreground mt-1">Choose a strong password for your account.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>New Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pr-10"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} confirmPassword={confirmPassword} showConfirm />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5 h-11"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !isPasswordValid(password) || password !== confirmPassword}
                  className="w-full h-11 hero-gradient font-semibold border-0"
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
