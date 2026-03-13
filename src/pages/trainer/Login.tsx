import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, ShieldAlert, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { checkLoginLocked, recordFailedAttempt, clearLoginAttempts } from "@/lib/loginProtection";
import { cleanPhone, isValidPhone } from "@/lib/formValidation";
import SkillMitraLogo from "@/components/SkillMitraLogo";
import { verifyPhoneWithOTP } from "@/lib/msg91";


const TrainerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [locked, setLocked] = useState<{ locked: boolean; minutesLeft: number }>({ locked: false, minutesLeft: 0 });
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [loginPhone, setLoginPhone] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
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

  const handlePhoneOTPLogin = async () => {
    if (!isValidPhone(loginPhone)) {
      toast({ title: "Please enter a valid 10-digit Indian mobile number", variant: "warning" });
      return;
    }
    setOtpLoading(true);
    try {
      const accessToken = await verifyPhoneWithOTP(loginPhone);

      const { data, error: fnError } = await supabase.functions.invoke("phone-otp-login", {
        body: { phone: loginPhone, accessToken },
      });
      if (fnError || data?.error) throw new Error(data?.error || fnError?.message || "Login failed");

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });
      if (verifyError) throw verifyError;

      toast({ title: "Signed in successfully", variant: "success" });
      // Navigation handled by useEffect watching user/role
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setOtpLoading(false);
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
        const result = await recordFailedAttempt(email);
        if (result.locked) {
          setLocked(result);
          setLoading(false);
          return;
        }
        throw error;
      }

      await clearLoginAttempts(email);
      toast({ title: "Signed in successfully", variant: "success" });
    } catch (err: any) {
      toast({ title: "Login failed", description: getAuthErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-12 sticky top-0 h-screen overflow-hidden">
        <div className="max-w-md">
          <SkillMitraLogo darkText={false} height={40} className="mb-12" />
          <h2 className="text-3xl font-bold text-primary-foreground">Welcome Back, Trainer!</h2>
          <p className="mt-4 text-primary-foreground/60 leading-relaxed">Manage your students, sessions, and earnings — all from one dashboard.</p>
          <div className="mt-8 space-y-3">
            {["Earn from your expertise", "Flexible schedule", "Verified trainer badge", "Monthly payouts"].map(b => (
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

          {/* Login method tabs */}
          <div className="flex mt-6 rounded-lg bg-muted p-1 gap-1">
            <button
              type="button"
              onClick={() => setLoginMethod("email")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${loginMethod === "email" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod("phone")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${loginMethod === "phone" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Phone OTP
            </button>
          </div>

          {loginMethod === "email" ? (
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
                <Link to="/forgot-password?role=trainer" className="text-sm text-primary font-semibold hover:underline">Forgot password?</Link>
              </div>

              <Button type="submit" disabled={loading || locked.locked} className="w-full h-11 hero-gradient font-semibold border-0">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>}
              </Button>
            </form>
          ) : (
            <div className="mt-6 space-y-5">
              <div>
                <Label htmlFor="trainer-login-phone">Mobile Number</Label>
                <Input
                  id="trainer-login-phone"
                  value={loginPhone}
                  onChange={e => setLoginPhone(cleanPhone(e.target.value))}
                  placeholder="9876543210"
                  maxLength={10}
                  inputMode="numeric"
                  className="mt-1.5 h-11"
                />
                <p className="text-xs text-muted-foreground mt-1">Enter the phone number linked to your account</p>
              </div>
              <Button
                type="button"
                onClick={handlePhoneOTPLogin}
                disabled={otpLoading || !isValidPhone(loginPhone)}
                className="w-full h-11 hero-gradient font-semibold border-0"
              >
                {otpLoading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>
                  : <>Verify & Sign In <ArrowRight className="ml-2 w-4 h-4" /></>
                }
              </Button>
            </div>
          )}

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
