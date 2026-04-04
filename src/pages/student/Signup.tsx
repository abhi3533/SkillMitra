import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Check, Gift, Loader2, CheckCircle2, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { cleanPhone, isValidPhone, isValidEmail, getEmailTypoSuggestion, isDisposableEmail } from "@/lib/formValidation";
import PasswordStrengthIndicator, { isPasswordValid } from "@/components/auth/PasswordStrengthIndicator";
import SkillMitraLogo from "@/components/SkillMitraLogo";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const languageOptions = ["Telugu", "Hindi", "Tamil", "English", "Kannada", "Malayalam", "Bengali", "Marathi"];
const courseInterestOptions = ["Python", "JavaScript", "React", "Node.js", "Java", "Data Science", "Machine Learning", "AWS", "Docker", "Figma", "UI/UX Design", "Digital Marketing", "SEO", "Flutter", "Cyber Security", "Product Management", "Salesforce", "Excel", "SQL", "Power BI", "Other"];
const stateOptions = ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Maharashtra", "Delhi", "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal", "Kerala"];

const RequiredMark = ({ ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span className="text-destructive ml-0.5" {...props}>*</span>;

const StudentSignup = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", city: "", state: "", gender: "", password: "", trainerPref: "no_preference" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailTypo, setEmailTypo] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [languages, setLanguages] = useState<string[]>([]);
  const [courseInterests, setCourseInterests] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otherSelected, setOtherSelected] = useState(false);
  const [otherSkill, setOtherSkill] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));
  const markTouched = (key: string) => setTouched(t => ({ ...t, [key]: true }));

  const toggleLang = (lang: string) => {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };
  const toggleInterest = (interest: string) => {
    setCourseInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  // Email validation on blur
  const handleEmailBlur = () => {
    markTouched("email");
    const typo = getEmailTypoSuggestion(form.email);
    setEmailTypo(typo);
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
        const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: profile.id });
        if (roleData === "trainer") setEmailError("This email is already registered as a trainer. Please use a different email or login with your existing account.");
        else if (roleData === "admin") setEmailError("This email is registered as admin.");
        else setEmailError("This email is already registered as a student. Please login instead.");
      } else {
        setEmailError("");
      }
    } catch { setEmailError(""); }
  };

  // Field validation helpers
  const isPhoneValid = form.phone.length === 0 || isValidPhone(form.phone);
  const isPhoneFilled = isValidPhone(form.phone);
  const isEmailValid = form.email.length === 0 || isValidEmail(form.email);
  const isEmailFilled = isValidEmail(form.email) && !emailError;
  const isNameLettersOnly = (val: string) => /^[a-zA-Z\s.'-]+$/.test(val.trim());

  const getFieldClass = (key: string, isValid: boolean, isFilled: boolean) => {
    if (!touched[key]) return "";
    if (isFilled) return "border-green-500 focus-visible:ring-green-500";
    if (!isValid) return "border-destructive focus-visible:ring-destructive";
    return "";
  };

  const scrollToFirstError = () => {
    const el = document.querySelector(".border-destructive");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // Touch all fields
    const allFields = ["fullName", "email", "phone", "city", "state", "gender", "password", "confirmPassword"];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach(f => newTouched[f] = true);
    setTouched(newTouched);

    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim() || !form.city.trim() || !form.state || !form.gender) {
      toast({ title: "Please fill all required fields", variant: "warning" });
      setTimeout(scrollToFirstError, 100);
      return;
    }
    if (!isNameLettersOnly(form.fullName)) {
      toast({ title: "Please enter a valid name", variant: "warning" });
      setTimeout(scrollToFirstError, 100);
      return;
    }
    if (!isValidEmail(form.email)) {
      toast({ title: "Please enter a valid email address", variant: "warning" });
      return;
    }
    if (emailError) return;
    if (!isPasswordValid(form.password)) {
      toast({ title: "Password doesn't meet all requirements", variant: "warning" });
      return;
    }
    if (form.password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "warning" });
      return;
    }
    if (!isValidPhone(form.phone)) {
      toast({ title: "Please enter a valid 10-digit Indian mobile number", variant: "warning" });
      return;
    }
    setLoading(true);
    try {
      const { data: signupData, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: 'https://skillmitra.online/student/dashboard',
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

      // Use edge function to update course interests (bypasses RLS when session not available)
      const allInterests = [...courseInterests];
      if (otherSelected && otherSkill.trim()) {
        otherSkill.split(",").map(s => s.trim()).filter(Boolean).forEach(s => {
          if (!allInterests.includes(s)) allInterests.push(s);
        });
      }
      // Always call complete-signup: generates referral code + saves course interests.
      if (signupData?.user?.id) {
        const { error: signupFnErr } = await supabase.functions.invoke("complete-signup", {
          body: { user_id: signupData.user.id, role: "student", student_data: { course_interests: allInterests } },
        });
        if (signupFnErr) console.error("complete-signup error:", signupFnErr);
      }

      // Process referral — important for reward credit, so log clearly on failure.
      const trimmedCode = referralCode.trim().toUpperCase();
      if (trimmedCode && signupData?.user?.id) {
        supabase.functions.invoke("process-referral", {
          body: { referral_code: trimmedCode, new_user_id: signupData.user.id },
        }).then(({ error: fnErr }) => {
          if (fnErr) console.error("Referral processing failed (code:", trimmedCode, "):", fnErr);
        });
      }

      // Welcome email and profile matching are best-effort — failure is non-critical.
      supabase.functions.invoke("send-email", {
        body: { type: "student_welcome", to: form.email, data: { name: form.fullName } },
      }).then(({ error: fnErr }) => { if (fnErr) console.error("Welcome email error:", fnErr); });

      if (signupData?.user?.id) {
        supabase.functions.invoke("profile-matching", {
          body: { new_user_id: signupData.user.id, role: "student" },
        }).then(({ error: fnErr }) => { if (fnErr) console.error("Profile matching error:", fnErr); });
      }

      toast({ title: "Account created!", description: "Please check your email to verify your account.", variant: "success" });
      navigate("/student/login");
    } catch (err: any) {
      toast({ title: "Signup failed", description: getAuthErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = form.fullName.trim() && isNameLettersOnly(form.fullName) && isEmailFilled && isPhoneFilled && form.city.trim() && form.state && form.gender && isPasswordValid(form.password) && form.password === confirmPassword && !emailError;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1">
      {/* Left Panel - Fixed */}
      <div className="hidden lg:flex fixed top-0 left-0 w-[40%] h-screen hero-gradient items-center justify-center p-12 overflow-hidden z-10">
        <div className="max-w-md">
          <SkillMitraLogo darkText={false} height={40} className="mb-12" />
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
      <div className="lg:ml-[40%] flex-1 flex items-start justify-center p-6 lg:p-12 min-h-screen">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg py-8">
          <div className="lg:hidden mb-8">
            <SkillMitraLogo darkText height={32} />
          </div>

          <h1 className="text-2xl font-bold text-foreground">Create Student Account</h1>
          <p className="mt-2 text-muted-foreground">Fill in your details to get started</p>

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
                <Label>Full Name<RequiredMark /></Label>
                <Input value={form.fullName} onChange={e => update("fullName", e.target.value)} onBlur={() => markTouched("fullName")} placeholder="Your full name"
                  className={`mt-1.5 h-11 ${touched.fullName ? (form.fullName.trim() && isNameLettersOnly(form.fullName) ? "border-green-500" : "border-destructive") : ""}`} required />
                {touched.fullName && !form.fullName.trim() && <p className="text-xs text-destructive mt-1">Full name is required</p>}
                {touched.fullName && form.fullName.trim() && !isNameLettersOnly(form.fullName) && <p className="text-xs text-destructive mt-1">Name must contain only letters</p>}
              </div>
              <div>
                <Label>Email<RequiredMark /></Label>
                <Input type="email" value={form.email} onChange={e => { update("email", e.target.value); setEmailTypo(null); }} onBlur={handleEmailBlur} placeholder="you@email.com"
                  className={`mt-1.5 h-11 ${touched.email ? (isEmailFilled ? "border-green-500" : (!isEmailValid || emailError ? "border-destructive" : "")) : ""}`} required />
                {emailError && (
                  <p className="text-xs text-destructive mt-1">
                    {emailError}{" "}
                    {emailError.includes("login instead") && <Link to="/student/login" className="font-semibold underline">Login here</Link>}
                    {emailError.includes("trainer login") && <Link to="/trainer/login" className="font-semibold underline">Trainer Login</Link>}
                  </p>
                )}
                {!emailError && touched.email && !isEmailValid && form.email.length > 0 && <p className="text-xs text-destructive mt-1">Please enter a valid email address</p>}
                {emailTypo && <p className="text-xs text-amber-600 mt-1">{emailTypo}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone<RequiredMark /></Label>
                <div className="relative">
                  <Input value={form.phone} onChange={e => update("phone", cleanPhone(e.target.value))} onBlur={() => markTouched("phone")} placeholder="9876543210" maxLength={10} inputMode="numeric"
                    className={`mt-1.5 h-11 pr-8 ${touched.phone ? (isPhoneFilled ? "border-green-500" : (form.phone.length > 0 && !isPhoneValid ? "border-destructive" : (!form.phone ? "border-destructive" : ""))) : ""}`} required />
                  {isPhoneFilled && <CheckCircle2 className="w-4 h-4 text-green-500 absolute right-3 top-1/2 mt-[3px] -translate-y-1/2" />}
                </div>
                {touched.phone && form.phone.length > 0 && !isPhoneFilled && <p className="text-xs text-destructive mt-1">Please enter a valid 10-digit Indian mobile number</p>}
                {touched.phone && !form.phone && <p className="text-xs text-destructive mt-1">Phone number is required</p>}
              </div>
              <div>
                <Label>Gender<RequiredMark /></Label>
                <Select value={form.gender} onValueChange={v => { update("gender", v); markTouched("gender"); }}>
                  <SelectTrigger className={`mt-1.5 h-11 ${touched.gender ? (form.gender ? "border-green-500" : "border-destructive") : ""}`}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {touched.gender && !form.gender && <p className="text-xs text-destructive mt-1">Gender is required</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>City<RequiredMark /></Label>
                <Input value={form.city} onChange={e => update("city", e.target.value.replace(/[^a-zA-Z\s'-]/g, ""))} onBlur={() => markTouched("city")} placeholder="Your city"
                  className={`mt-1.5 h-11 ${touched.city ? (form.city.trim() ? "border-green-500" : "border-destructive") : ""}`} required />
                {touched.city && !form.city.trim() && <p className="text-xs text-destructive mt-1">City is required</p>}
              </div>
              <div>
                <Label>State<RequiredMark /></Label>
                <Select value={form.state} onValueChange={v => { update("state", v); markTouched("state"); }}>
                  <SelectTrigger className={`mt-1.5 h-11 ${touched.state ? (form.state ? "border-green-500" : "border-destructive") : ""}`}><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {stateOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {touched.state && !form.state && <p className="text-xs text-destructive mt-1">State is required</p>}
              </div>
            </div>

            <div>
              <Label>Preferred Learning Languages</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" type="button" className={cn("w-full mt-1.5 h-auto min-h-[44px] justify-between font-normal", !languages.length && "text-muted-foreground")}>
                    {languages.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mr-2">
                        {languages.map(lang => (
                          <Badge key={lang} variant="secondary" className="text-xs">
                            {lang}
                            <button type="button" className="ml-1 rounded-full outline-none hover:bg-muted" onClick={e => { e.stopPropagation(); toggleLang(lang); }}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : "Select languages"}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search languages..." />
                    <CommandList>
                      <CommandEmpty>No language found.</CommandEmpty>
                      <CommandGroup>
                        {languageOptions.map(lang => (
                          <CommandItem key={lang} onSelect={() => toggleLang(lang)} className="cursor-pointer">
                            <Check className={cn("mr-2 h-4 w-4", languages.includes(lang) ? "opacity-100" : "opacity-0")} />
                            {lang}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Courses You're Interested In</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" type="button" className={cn("w-full mt-1.5 h-auto min-h-[44px] justify-between font-normal", !courseInterests.length && !otherSelected && "text-muted-foreground")}>
                    {courseInterests.length > 0 || otherSelected ? (
                      <div className="flex flex-wrap gap-1 mr-2">
                        {courseInterests.map(c => (
                          <Badge key={c} variant="secondary" className="text-xs">
                            {c}
                            <button type="button" className="ml-1 rounded-full outline-none hover:bg-muted" onClick={e => { e.stopPropagation(); if (c === "Other") { setOtherSelected(false); setOtherSkill(""); } else toggleInterest(c); }}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        {otherSelected && !courseInterests.includes("Other") && (
                          <Badge variant="secondary" className="text-xs">
                            Other
                            <button type="button" className="ml-1 rounded-full outline-none hover:bg-muted" onClick={e => { e.stopPropagation(); setOtherSelected(false); setOtherSkill(""); }}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )}
                      </div>
                    ) : "Select courses"}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search courses..." />
                    <CommandList>
                      <CommandEmpty>No course found.</CommandEmpty>
                      <CommandGroup>
                        {courseInterestOptions.map(interest => (
                          <CommandItem key={interest} onSelect={() => {
                            if (interest === "Other") { setOtherSelected(prev => { if (prev) setOtherSkill(""); return !prev; }); }
                            else toggleInterest(interest);
                          }} className="cursor-pointer">
                            <Check className={cn("mr-2 h-4 w-4", (interest === "Other" ? otherSelected : courseInterests.includes(interest)) ? "opacity-100" : "opacity-0")} />
                            {interest}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {otherSelected && (
                <Input
                  value={otherSkill}
                  onChange={e => setOtherSkill(e.target.value)}
                  placeholder="e.g. Yoga, Cooking, Photography, Music"
                  className="mt-2 h-11"
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {otherSelected ? "Please specify your course or skill" : "Select skills you want to learn — helps us match you with the right trainers"}
              </p>
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
              <Label>Password<RequiredMark /></Label>
              <div className="relative mt-1.5">
                <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)} onBlur={() => markTouched("password")} placeholder="Min 8 characters" className="h-11 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={form.password} confirmPassword={confirmPassword} showConfirm />
              <p className="text-xs text-muted-foreground mt-1">Avoid common passwords like Test@1234, Password@1, Admin@123</p>
            </div>

            <div>
              <Label>Confirm Password<RequiredMark /></Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onBlur={() => markTouched("confirmPassword")} placeholder="Re-enter password" className="mt-1.5 h-11" required />
            </div>

            <Button type="submit" disabled={loading || !isFormValid} className="w-full h-11 hero-gradient font-semibold border-0">
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Account...</>
                : <>Create Account <ArrowRight className="ml-2 w-4 h-4" /></>
              }
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/student/login" className="text-primary font-semibold hover:underline">Log in</Link>
          </p>
        </motion.div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default StudentSignup;
