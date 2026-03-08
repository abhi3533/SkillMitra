import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { checkLoginLocked, recordFailedAttempt, clearLoginAttempts } from "@/lib/loginProtection";

const TrainerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [locked, setLocked] = useState<{ locked: boolean; minutesLeft: number }>({ locked: false, minutesLeft: 0 });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role) {
      if (role === "admin") navigate("/admin", { replace: true });
      else if (role === "trainer") navigate("/trainer/dashboard", { replace: true });
      else navigate("/student/dashboard", { replace: true });
    }
  }, [user, role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const lockStatus = checkLoginLocked(email);
    if (lockStatus.locked) {
      setLocked(lockStatus);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message?.includes("Email not confirmed")) {
          toast({
            title: "Email not verified",
            description: "Please verify your email first.",
            variant: "destructive",
            action: (
              <Button variant="outline" size="sm" onClick={async () => {
                await supabase.auth.resend({ type: "signup", email });
                toast({ title: "Verification email resent!" });
              }}>
                Resend
              </Button>
            ),
          });
          setLoading(false);
          return;
        }
        const result = recordFailedAttempt(email);
        if (result.locked) {
          setLocked(result);
          setLoading(false);
          return;
        }
        throw error;
      }

      clearLoginAttempts(email);
      const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: data.user.id });
      if (roleData === "student") navigate("/student/dashboard");
      else if (roleData === "admin") navigate("/admin");
      else navigate("/trainer/dashboard");
      toast({ title: "Signed in successfully" });
    } catch (err: any) {
      toast({ title: "Login failed", description: getAuthErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-12">
        <div className="max-w-md">
          <Link to="/" className="flex items-center mb-12">
            <img src="/skillmitra-logo-white.png" alt="SkillMitra" className="h-9 w-auto block" style={{ background: 'transparent' }} />
          </Link>
          <h2 className="text-3xl font-bold text-primary-foreground">Welcome Back, Trainer!</h2>
          <p className="mt-4 text-primary-foreground/60 leading-relaxed">Manage your students, sessions, and earnings — all from one dashboard.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center">
              <img src="/skillmitra-logo.png?v=2" alt="SkillMitra" className="h-9 w-auto block" style={{ background: 'transparent' }} />
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-foreground">Trainer Login</h1>
          <p className="mt-2 text-muted-foreground">Sign in to your trainer dashboard</p>

          {locked.locked && (
            <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">Account temporarily locked</p>
                <p className="text-xs text-destructive/80 mt-1">Too many failed login attempts. Please try again in {locked.minutesLeft} minute{locked.minutesLeft > 1 ? "s" : ""}.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
              <Link to="/forgot-password?role=trainer" className="text-sm text-primary font-semibold hover:underline">Forgot password?</Link>
            </div>

            <Button type="submit" disabled={loading || locked.locked} className="w-full h-11 hero-gradient font-semibold border-0">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/trainer/signup" className="text-primary font-semibold hover:underline">Apply as Trainer</Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Are you a student? <Link to="/student/login" className="text-accent font-semibold hover:underline">Student Login</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default TrainerLogin;
