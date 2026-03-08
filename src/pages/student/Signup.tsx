import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Check, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";
import PasswordStrengthIndicator, { isPasswordValid } from "@/components/auth/PasswordStrengthIndicator";

const languageOptions = ["Telugu", "Hindi", "Tamil", "English", "Kannada", "Malayalam", "Bengali", "Marathi"];
const stateOptions = ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Maharashtra", "Delhi", "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal", "Kerala"];

const StudentSignup = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", city: "", state: "", gender: "", password: "", trainerPref: "no_preference" });
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [languages, setLanguages] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const toggleLang = (lang: string) => {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (form.password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (languages.length === 0) {
      toast({ title: "Select at least one language", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: signupData, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: form.fullName,
            phone: form.phone,
            role: "student",
            city: form.city || undefined,
            state: form.state || undefined,
            gender: form.gender || undefined,
            language_preference: languages,
            trainer_gender_preference: form.trainerPref,
          },
        },
      });
      if (error) throw error;

      // Process referral if code provided (fire-and-forget)
      const trimmedCode = referralCode.trim().toUpperCase();
      if (trimmedCode && signupData?.user?.id) {
        supabase.functions.invoke("process-referral", {
          body: { referral_code: trimmedCode, new_user_id: signupData.user.id },
        }).then(({ error: fnErr }) => {
          if (fnErr) console.error("Referral processing error:", fnErr);
        });
      }

      // Send welcome email (fire-and-forget)
      supabase.functions.invoke("send-email", {
        body: { type: "student_welcome", to: form.email, data: { name: form.fullName } },
      }).then(({ error: fnErr }) => { if (fnErr) console.error("Welcome email error:", fnErr); });

      toast({ title: "Account created!", description: "Please check your email to verify your account." });
      navigate("/student/login");
    } catch (err: any) {
      toast({ title: "Signup failed", description: getAuthErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-5/12 hero-gradient items-center justify-center p-12">
        <div className="max-w-md">
          <Link to="/" className="flex items-center mb-12">
            <span className="text-[22px] font-bold" style={{ fontFamily: "Inter, sans-serif" }}>
              <span style={{ color: "#FFFFFF" }}>Skill</span><span style={{ color: "#6EA8FE" }}>Mitra</span>
            </span>
          </Link>
          <h2 className="text-3xl font-bold text-primary-foreground">Start your learning journey today</h2>
          <p className="mt-4 text-primary-foreground/60 leading-relaxed">Join students learning from verified industry experts in their own language.</p>
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

      {/* Right Panel */}
      <div className="flex-1 flex items-start justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg py-8">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center">
              <span className="text-[22px] font-bold" style={{ fontFamily: "Inter, sans-serif" }}>
                <span style={{ color: "#0F172A" }}>Skill</span><span style={{ color: "#1A56DB" }}>Mitra</span>
              </span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-foreground">Create Student Account</h1>
          <p className="mt-2 text-muted-foreground">Fill in your details to get started</p>

          {/* Referral banner */}
          {referralCode && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700">
                Referral code <span className="font-bold">{referralCode.toUpperCase()}</span> applied — you'll get ₹200 wallet credit!
              </p>
            </div>
          )}

          <form onSubmit={handleSignup} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={form.fullName} onChange={e => update("fullName", e.target.value)} placeholder="Your full name" className="mt-1.5 h-11" required />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@email.com" className="mt-1.5 h-11" required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone *</Label>
                <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+91 98765 43210" className="mt-1.5 h-11" required />
              </div>
              <div>
                <Label>Gender *</Label>
                <Select value={form.gender} onValueChange={v => update("gender", v)}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={e => update("city", e.target.value)} placeholder="Your city" className="mt-1.5 h-11" />
              </div>
              <div>
                <Label>State</Label>
                <Select value={form.state} onValueChange={v => update("state", v)}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {stateOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Preferred Learning Languages *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {languageOptions.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLang(lang)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      languages.includes(lang)
                        ? "hero-gradient text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Trainer Gender Preference</Label>
              <Select value={form.trainerPref} onValueChange={v => update("trainerPref", v)}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male Trainer</SelectItem>
                  <SelectItem value="female">Female Trainer</SelectItem>
                  <SelectItem value="no_preference">No Preference</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Referral Code Field */}
            <div>
              <Label>Referral Code <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. SM-A1B2C3"
                className="mt-1.5 h-11 font-mono uppercase"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground mt-1">Have a friend's code? Both of you get ₹200 wallet credit!</p>
            </div>

            <div>
              <Label>Password *</Label>
              <div className="relative mt-1.5">
                <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)} placeholder="Min 8 characters" className="h-11 pr-10" required minLength={8} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 hero-gradient font-semibold border-0">
              {loading ? "Creating account..." : "Create Account"} {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/student/login" className="text-primary font-semibold hover:underline">Log in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentSignup;
