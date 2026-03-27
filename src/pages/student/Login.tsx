import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, ShieldAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { checkLoginLocked, recordFailedAttempt, clearLoginAttempts } from "@/lib/loginProtection";
import SkillMitraLogo from "@/components/SkillMitraLogo";


const STUDENT_VERIFICATION_REDIRECT = "https://skillmitra.online/student/dashboard";

const StudentLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [locked, setLocked] = useState<{ locked: boolean; minutesLeft: number }>({ locked: false, minutesLeft: 0 });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Prevent open redirect: only allow relative paths starting with "/"
  const rawRedirect = searchParams.get("redirect");
  const redirectUrl =
    rawRedirect && /^\/[^/\\]/.test(rawRedirect) ? rawRedirect : null;
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role) {
      if (redirectUrl && role === "student") navigate(redirectUrl, { replace: true });
      else if (role === "admin") navigate("/admin", { replace: true });
      else if (role === "trainer") navigate("/trainer/dashboard", { replace: true });
      else navigate("/student/dashboard", { replace: true });
    }
  }, [user, role]);

  const signInWithTimeout = async (email: string, password: string, timeoutMs = 10000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out. Please try again.")), timeoutMs)
        ),
      ]);
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const lockStatus = await checkLoginLocked(email);
    if (lockStatus.locked) {
      setLocked(lockStatus);
      return;
    }

    setLoading(true);
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await signInWithTimeout(email, password, 10000);
        if (error) {
          if (error.message?.includes("Email not confirmed")) {
            toast({
              title: "Email not verified",
              description: "Please verify your email first. Check your inbox for the confirmation link.",
              variant: "warning",
              action: (
                <Button variant="outline" size="sm" onClick={async () => {
                  const { error: resendError } = await supabase.auth.resend({
                    type: "signup",
                    email,
                    options: { emailRedirectTo: STUDENT_VERIFICATION_REDIRECT },
                  });

                  if (resendError) {
                    toast({
                      title: "Could not resend verification email",
                      description: getAuthErrorMessage(resendError),
                      variant: "destructive",
                    });
                    return;
                  }

                  toast({ title: "Verification email resent!", variant: "info" });
                }}>
                  Resend
                </Button>
              ),
            });
            setLoading(false);
            return;
          }
          // Auth errors (wrong password etc) — don't retry
          if (error.message?.includes("Invalid login") || error.message?.includes("invalid_credentials")) {
            const result = await recordFailedAttempt(email);
            if (result.locked) {
              setLocked(result);
              setLoading(false);
              return;
            }
            throw error;
          }
          // Network/server errors — retry
          lastError = error;
          if (attempt < maxRetries) continue;
          throw error;
        }

        await clearLoginAttempts(email);
        const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: data.user.id });
        if (redirectUrl && roleData === "student") navigate(redirectUrl);
        else if (roleData === "trainer") navigate("/trainer/dashboard");
        else if (roleData === "admin") navigate("/admin");
        else navigate("/student/dashboard");
        toast({ title: "Signed in successfully", variant: "success" });
        return;
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries && (err.message?.includes("timed out") || err.message?.includes("fetch"))) {
          continue; // retry on timeout/network errors
        }
      }
    }

    toast({ title: "Login failed", description: getAuthErrorMessage(lastError), variant: "destructive" });
    setLoading(false);
  };

  // Safety timeout — never block spinner for more than 15s
  useEffect(() => {
    if (!loading) return;
    const safety = setTimeout(() => {
      setLoading(false);
      toast({ title: "Something went wrong", description: "Server is taking too long. Please try again.", variant: "destructive" });
    }, 15000);
    return () => clearTimeout(safety);
  }, [loading]);

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-12 sticky top-0 h-screen overflow-hidden">
        <div className="max-w-md">
          <SkillMitraLogo darkText={false} height={40} className="mb-12" />
          <h2 className="text-3xl font-bold text-primary-foreground">Welcome Back, Student!</h2>
          <p className="mt-4 text-primary-foreground/60 leading-relaxed">Continue your training journey with India's best trainers.</p>
          <div className="mt-8 space-y-3">
            {["1:1 Personal training", "Learn in your language", "Verified expert trainers", "Earn certificates"].map(b => (
              <div key={b} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full gold-gradient flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-accent-foreground" />
                </div>
                <span className="text-sm text-primary-foreground/70">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <SkillMitraLogo darkText height={32} />
          </div>

          <h1 className="text-2xl font-bold text-foreground">Student Login</h1>
          <p className="mt-2 text-muted-foreground">Enter your credentials to access your dashboard</p>

          {locked.locked && (
            <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">Account temporarily locked</p>
                <p className="text-xs text-destructive/80 mt-1">Too many failed login attempts. Please try again in {locked.minutesLeft} minute{locked.minutesLeft > 1 ? "s" : ""}.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => { setEmail(e.target.value); setLocked({ locked: false, minutesLeft: 0 }); }} placeholder="you@example.com" className="mt-1.5 h-11" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(!!c)} />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Remember me</label>
              </div>
              <Link to="/forgot-password?role=student" className="text-sm text-primary font-semibold hover:underline">Forgot password?</Link>
            </div>

            <Button type="submit" disabled={loading || locked.locked} className="w-full h-11 hero-gradient font-semibold border-0">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/student/signup" className="text-primary font-semibold hover:underline">Sign up free</Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Are you a trainer? <Link to="/trainer/login" className="text-accent font-semibold hover:underline">Trainer Login</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentLogin;
