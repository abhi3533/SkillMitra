import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, Shield, Phone, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { cleanPhone, isValidPhone, isValidEmail, getEmailTypoSuggestion, isDisposableEmail } from "@/lib/formValidation";
import PasswordStrengthIndicator, { isPasswordValid } from "@/components/auth/PasswordStrengthIndicator";
import SkillMitraLogo from "@/components/SkillMitraLogo";

const TrainerSignup = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailTypo, setEmailTypo] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));
  const markTouched = (key: string) => setTouched(t => ({ ...t, [key]: true }));

  const isValidName = (val: string) => /^[a-zA-Z\s.'-]+$/.test(val.trim());

  const handleEmailBlur = () => {
    markTouched("email");
    setEmailTypo(getEmailTypoSuggestion(form.email));
    checkDuplicateEmail(form.email);
  };

  const checkDuplicateEmail = async (email: string) => {
    if (!email || !isValidEmail(email)) { setEmailError(""); return; }
    if (isDisposableEmail(email)) {
      setEmailError("Temporary/disposable email addresses are not allowed.");
      return;
    }
    try {
      const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
      if (profile) {
        setEmailError("Account already exists. Login instead.");
      } else { setEmailError(""); }
    } catch { setEmailError(""); }
  };

  const handleSubmit = async () => {
    const allKeys = ["fullName", "email", "phone", "password"];
    const newTouched: Record<string, boolean> = {};
    allKeys.forEach(k => newTouched[k] = true);
    setTouched(newTouched);

    if (!form.fullName.trim() || !isValidName(form.fullName)) {
      toast({ title: "Please enter a valid full name", variant: "warning" }); return;
    }
    if (!isValidEmail(form.email) || emailError) {
      toast({ title: emailError || "Valid email is required", variant: "warning" }); return;
    }
    if (!isValidPhone(form.phone)) {
      toast({ title: "Valid 10-digit Indian mobile number required", variant: "warning" }); return;
    }
    if (!isPasswordValid(form.password)) {
      toast({ title: "Password doesn't meet requirements", variant: "warning" }); return;
    }
    if (form.password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "warning" }); return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/email-verified`,
          data: {
            full_name: form.fullName,
            phone: form.phone,
            role: "trainer",
          },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      // Send admin notification about new registration
      supabase.functions.invoke("notify-admin-new-trainer", {
        body: {
          user_id: authData.user.id,
          trainer_name: form.fullName,
          email: form.email,
          phone: form.phone,
          registration_only: true,
        },
      }).catch(console.error);

      // Process trainer referral code if provided
      if (referralCode.trim()) {
        supabase.functions.invoke("process-trainer-referral", {
          body: {
            referral_code: referralCode.trim(),
            new_user_id: authData.user.id,
          },
        }).catch(console.error);
      }

      setSubmitted(true);
      toast({ title: "Account created!", description: "Check your email to verify your account.", variant: "success" });
    } catch (err: any) {
      console.error("Trainer signup error:", err);
      toast({ title: "Signup failed", description: getAuthErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto rounded-full hero-gradient flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Check Your Email</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We've sent a verification link to <span className="font-semibold text-foreground">{form.email}</span>.
            Click the link to verify your account, then log in to complete your trainer profile.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Mobile number <span className="font-semibold text-foreground">{form.phone}</span> is saved for admin follow-up.
          </p>
          <div className="mt-8 space-y-3">
            <Link to="/trainer/login">
              <Button className="hero-gradient border-0 font-semibold w-full">Go to Trainer Login <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full">Back to Home</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex fixed top-0 left-0 w-[40%] h-screen hero-gradient items-center justify-center p-12 overflow-hidden z-10">
        <div className="max-w-md">
          <SkillMitraLogo darkText={false} height={40} className="mb-12" />
          <h2 className="text-3xl font-bold text-primary-foreground">Start earning from your expertise</h2>
          <p className="mt-4 text-primary-foreground/60 leading-relaxed">Join verified trainers earning from home teaching skills they love.</p>
          <div className="mt-10 space-y-4">
            {["Create your account", "Verify your email", "Complete your profile", "Start teaching"].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  i === 0 ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary-foreground/5 text-primary-foreground/30"
                }`}>
                  {i + 1}
                </div>
                <span className={`text-sm ${i === 0 ? "text-primary-foreground" : "text-primary-foreground/30"}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="lg:ml-[40%] flex-1 flex items-start justify-center p-6 lg:p-12 min-h-screen">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg py-8">
          <div className="lg:hidden mb-6">
            <SkillMitraLogo darkText height={32} />
          </div>

          <h1 className="text-2xl font-bold text-foreground">Create Your Trainer Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Quick signup — complete your full profile after email verification</p>

          <div className="mt-6 space-y-4">

            <div>
              <Label>Full Name<span className="text-destructive ml-0.5">*</span></Label>
              <Input value={form.fullName} onChange={e => update("fullName", e.target.value)} onBlur={() => markTouched("fullName")} placeholder="Your full name"
                className={`mt-1.5 h-11 ${touched.fullName ? (form.fullName.trim() && isValidName(form.fullName) ? "border-green-500" : "border-destructive") : ""}`} />
              {touched.fullName && !form.fullName.trim() && <p className="text-xs text-destructive mt-1">Required</p>}
              {touched.fullName && form.fullName.trim() && !isValidName(form.fullName) && <p className="text-xs text-destructive mt-1">Name must contain only letters</p>}
            </div>

            <div>
              <Label>Email<span className="text-destructive ml-0.5">*</span></Label>
              <Input type="email" value={form.email} onChange={e => { update("email", e.target.value); setEmailTypo(null); setEmailError(""); }} onBlur={handleEmailBlur} placeholder="you@email.com"
                className={`mt-1.5 h-11 ${touched.email ? (isValidEmail(form.email) && !emailError ? "border-green-500" : "border-destructive") : ""}`} />
              {emailError && (
                <p className="text-xs text-destructive mt-1">{emailError} <Link to="/trainer/login" className="text-primary underline font-medium">Login here</Link></p>
              )}
              {emailTypo && <p className="text-xs text-amber-600 mt-1">{emailTypo}</p>}
            </div>

            <div>
              <Label className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Mobile Number<span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                value={form.phone}
                onChange={e => update("phone", cleanPhone(e.target.value))}
                onBlur={() => markTouched("phone")}
                placeholder="9876543210"
                maxLength={10}
                inputMode="numeric"
                className={`mt-1.5 h-11 ${touched.phone ? (isValidPhone(form.phone) ? "border-green-500" : "border-destructive") : ""}`}
              />
              <p className="text-xs text-muted-foreground mt-1">Required for admin follow-up and verification</p>
            </div>

            <div>
              <Label>Password<span className="text-destructive ml-0.5">*</span></Label>
              <div className="relative mt-1.5">
                <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)} placeholder="Min 8 characters" className="h-11 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={form.password} confirmPassword={confirmPassword} showConfirm />
            </div>

            <div>
              <Label>Confirm Password<span className="text-destructive ml-0.5">*</span></Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="mt-1.5 h-11" />
            </div>

            <div>
              <Label className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-primary" />
                Have a referral code? Enter it here <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} placeholder="e.g. TM-ABC123" className="mt-1.5 h-11" maxLength={12} />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">Your data is encrypted and protected.</p>
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full h-11 hero-gradient border-0 font-semibold text-base">
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Account...</>
                : <>Create Account & Verify Email <ArrowRight className="ml-2 w-4 h-4" /></>
              }
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already registered? <Link to="/trainer/login" className="text-primary font-semibold hover:underline">Trainer Login</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default TrainerSignup;
