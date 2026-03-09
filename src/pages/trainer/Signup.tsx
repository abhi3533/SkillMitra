import { useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Check, ChevronRight, ChevronLeft, Upload, FileCheck, Loader2, CheckCircle2, Camera, X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { cleanPhone, isValidPhone, isValidEmail, getEmailTypoSuggestion } from "@/lib/formValidation";
import PasswordStrengthIndicator, { isPasswordValid } from "@/components/auth/PasswordStrengthIndicator";
import SkillMitraLogo from "@/components/SkillMitraLogo";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

const skillOptions = ["Python", "JavaScript", "React", "Node.js", "Java", "Data Science", "Machine Learning", "AWS", "Docker", "Figma", "UI/UX Design", "Digital Marketing", "SEO", "Flutter", "Cyber Security", "Product Management", "Salesforce", "Excel", "SQL", "Power BI"];
const langOptions = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Bengali", "Marathi"];
const stateOptions = ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Maharashtra", "Delhi", "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal", "Kerala"];
const steps = ["Personal Info", "Skills & Experience", "Documents", "Availability", "Bank Details"];

interface DocFile { file: File | null; name: string; }
interface AvailDay { checked: boolean; start: string; end: string; }

const defaultAvail: Record<string, AvailDay> = {
  Monday: { checked: true, start: "09:00", end: "18:00" },
  Tuesday: { checked: true, start: "09:00", end: "18:00" },
  Wednesday: { checked: true, start: "09:00", end: "18:00" },
  Thursday: { checked: true, start: "09:00", end: "18:00" },
  Friday: { checked: true, start: "09:00", end: "18:00" },
  Saturday: { checked: true, start: "09:00", end: "18:00" },
  Sunday: { checked: false, start: "09:00", end: "18:00" },
};

const docTypes = [
  { key: "government_id", label: "Government ID (Aadhaar/PAN)", bucket: "trainer-documents", accept: ".pdf,.jpg,.jpeg,.png", required: true },
  { key: "resume", label: "Resume / CV", bucket: "trainer-documents", accept: ".pdf,.doc,.docx", required: false },
  { key: "experience_certificate", label: "Experience Certificate", bucket: "trainer-documents", accept: ".pdf,.jpg,.jpeg,.png", required: false },
  { key: "skill_certificates", label: "Skill Certificates", bucket: "trainer-documents", accept: ".pdf,.jpg,.jpeg,.png", required: false },
  { key: "intro_video", label: "Intro Video (2 min max)", bucket: "intro-videos", accept: "video/*", required: false },
];

const RequiredMark = () => <span className="text-destructive ml-0.5">*</span>;

const TrainerSignup = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", city: "", state: "", gender: "", password: "",
    currentRole: "", currentCompany: "", experience: "", linkedinUrl: "",
    bio: "", previousCompanies: "",
    bankAccount: "", ifsc: "", upiId: "", panNumber: "", accountHolderName: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailTypo, setEmailTypo] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [teachLangs, setTeachLangs] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [docs, setDocs] = useState<Record<string, DocFile>>({});
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const profilePhotoRef = useRef<HTMLInputElement | null>(null);
  const [availability, setAvailability] = useState<Record<string, AvailDay>>(defaultAvail);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [stepAttempted, setStepAttempted] = useState<Record<number, boolean>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));
  const markTouched = (key: string) => setTouched(t => ({ ...t, [key]: true }));
  const toggleSkill = (s: string) => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleLang = (l: string) => setTeachLangs(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l]);

  const handlePhoneChange = (val: string) => update("phone", cleanPhone(val));
  const handleEmailBlur = () => {
    markTouched("email");
    setEmailTypo(getEmailTypoSuggestion(form.email));
    checkDuplicateEmail(form.email);
  };

  const handleFileSelect = (docKey: string, file: File | null) => {
    if (file) setDocs(prev => ({ ...prev, [docKey]: { file, name: file.name } }));
  };

  const updateAvail = (day: string, field: keyof AvailDay, value: any) => {
    setAvailability(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const checkDuplicateEmail = async (email: string) => {
    if (!email || !isValidEmail(email)) { setEmailError(""); return; }
    try {
      const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
      if (profile) {
        const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: profile.id });
        if (roleData === "student") setEmailError("This email is registered as a student. Please use student login.");
        else if (roleData === "admin") setEmailError("This email is registered as admin.");
        else setEmailError("An account with this email already exists. Please login instead.");
      } else { setEmailError(""); }
    } catch { setEmailError(""); }
  };

  const isPhoneFilled = isValidPhone(form.phone);
  const isEmailFilled = isValidEmail(form.email) && !emailError;

  const handleProfilePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Photo must be less than 5MB", variant: "warning" });
        return;
      }
      setProfilePhoto(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const removeProfilePhoto = () => {
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
    if (profilePhotoRef.current) profilePhotoRef.current.value = "";
  };

  // Count remaining required fields per step
  const getStepProgress = (s: number): { total: number; filled: number } => {
    if (s === 0) {
      const fields = [form.fullName.trim(), form.email.trim(), form.phone.trim(), form.city.trim(), form.state, form.gender, form.password.trim(), confirmPassword.trim()];
      return { total: fields.length, filled: fields.filter(Boolean).length };
    }
    if (s === 1) {
      const filled = [skills.length > 0, form.experience.trim(), form.currentRole.trim(), form.currentCompany.trim(), teachLangs.length > 0, form.bio.trim()].filter(Boolean).length;
      return { total: 6, filled };
    }
    if (s === 2) {
      return { total: 1, filled: docs["government_id"]?.file ? 1 : 0 };
    }
    if (s === 3) {
      const hasSlot = Object.values(availability).some(v => v.checked);
      return { total: 1, filled: hasSlot ? 1 : 0 };
    }
    return { total: 0, filled: 0 };
  };

  const validateStep = (s: number): boolean => {
    setStepAttempted(p => ({ ...p, [s]: true }));
    if (s === 0) {
      const allKeys = ["fullName", "email", "phone", "city", "state", "gender", "password", "confirmPassword"];
      const newTouched: Record<string, boolean> = { ...touched };
      allKeys.forEach(k => newTouched[k] = true);
      setTouched(newTouched);

      if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim() || !form.city.trim() || !form.state || !form.gender) {
        toast({ title: "Please fill all required fields", variant: "warning" });
        return false;
      }
      if (!isValidEmail(form.email)) {
        toast({ title: "Please enter a valid email address", variant: "warning" });
        return false;
      }
      if (emailError) return false;
      if (!isValidPhone(form.phone)) {
        toast({ title: "Please enter a valid 10-digit Indian mobile number", variant: "warning" });
        return false;
      }
      if (!isPasswordValid(form.password)) {
        toast({ title: "Password doesn't meet all requirements", variant: "warning" });
        return false;
      }
      if (form.password !== confirmPassword) {
        toast({ title: "Passwords do not match", variant: "destructive" });
        return false;
      }
    }
    if (s === 1) {
      if (skills.length === 0) { toast({ title: "Select at least one skill", variant: "destructive" }); return false; }
      if (!form.experience.trim()) { toast({ title: "Years of experience is required", variant: "destructive" }); return false; }
      if (!form.currentRole.trim()) { toast({ title: "Current role is required", variant: "destructive" }); return false; }
      if (!form.currentCompany.trim()) { toast({ title: "Current company is required", variant: "destructive" }); return false; }
      if (teachLangs.length === 0) { toast({ title: "Select at least one teaching language", variant: "destructive" }); return false; }
      if (!form.bio.trim()) { toast({ title: "Please add your bio", variant: "destructive" }); return false; }
    }
    if (s === 2) {
      if (!docs["government_id"]?.file) {
        toast({ title: "Government ID is required for verification", variant: "destructive" });
        return false;
      }
    }
    if (s === 3) {
      const hasSlot = Object.values(availability).some(v => v.checked);
      if (!hasSlot) {
        toast({ title: "Select at least one availability slot", variant: "destructive" });
        return false;
      }
    }
    // Step 4 (bank details) — all optional
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const uploadFile = async (userId: string, trainerId: string, docKey: string, bucket: string, file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${docKey}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw new Error(`Upload failed for ${docKey}: ${error.message}`);
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    if (!agreed) { toast({ title: "Please agree to the terms", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: form.fullName, phone: form.phone, role: "trainer", city: form.city, state: form.state, gender: form.gender },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      const userId = authData.user.id;

      // Upload files using storage (anon key works for public buckets)
      let profilePictureUrl: string | null = null;
      if (profilePhoto) {
        const ext = profilePhoto.name.split('.').pop();
        const photoPath = `${userId}/profile.${ext}`;
        const { error: photoErr } = await supabase.storage.from("profile-pictures").upload(photoPath, profilePhoto, { upsert: true });
        if (photoErr) console.error("Profile photo upload failed:", photoErr.message);
        else {
          const { data: photoUrl } = supabase.storage.from("profile-pictures").getPublicUrl(photoPath);
          profilePictureUrl = photoUrl.publicUrl;
        }
      }

      // Upload documents
      let introVideoUrl: string | null = null;
      const uploadedDocs: { document_type: string; document_name: string; document_url: string }[] = [];
      for (const docType of docTypes) {
        const docFile = docs[docType.key];
        if (docFile?.file) {
          try {
            const ext = docFile.file.name.split('.').pop();
            const path = `${userId}/${docType.key}.${ext}`;
            const { error: upErr } = await supabase.storage.from(docType.bucket).upload(path, docFile.file, { upsert: true });
            if (upErr) { console.error(`Upload failed for ${docType.key}:`, upErr); continue; }
            const { data: urlData } = supabase.storage.from(docType.bucket).getPublicUrl(path);
            if (docType.key === "intro_video") {
              introVideoUrl = urlData.publicUrl;
            } else {
              uploadedDocs.push({ document_type: docType.key, document_name: docFile.name, document_url: urlData.publicUrl });
            }
          } catch (e) { console.error(`Doc upload error for ${docType.key}:`, e); }
        }
      }

      // Build availability data
      const dayMap: Record<string, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0 };
      const availRows = Object.entries(availability).map(([day, val]) => ({
        day_of_week: dayMap[day],
        start_time: val.start,
        end_time: val.end,
        is_available: val.checked,
      }));

      // Use edge function (service role) to complete trainer setup — bypasses RLS
      const { error: completeErr } = await supabase.functions.invoke("complete-signup", {
        body: {
          user_id: userId,
          role: "trainer",
          trainer_data: {
            bio: form.bio,
            skills,
            teaching_languages: teachLangs,
            experience_years: parseInt(form.experience) || 0,
            current_role: form.currentRole,
            current_company: form.currentCompany,
            linkedin_url: form.linkedinUrl || null,
            previous_companies: form.previousCompanies ? form.previousCompanies.split(",").map(c => c.trim()).filter(Boolean) : [],
            bank_account_number: form.bankAccount || null,
            ifsc_code: form.ifsc || null,
            upi_id: form.upiId || null,
            pan_number: form.panNumber || null,
            account_holder_name: form.accountHolderName || null,
            intro_video_url: introVideoUrl,
            profile_picture_url: profilePictureUrl,
            availability: availRows,
            documents: uploadedDocs,
          },
        },
      });

      if (completeErr) {
        console.error("Complete signup error:", completeErr);
        // Don't block — the basic account was created, details can be updated later
      }

      const trimmedRef = referralCode.trim().toUpperCase();
      if (trimmedRef) {
        supabase.functions.invoke("process-trainer-referral", {
          body: { referral_code: trimmedRef, new_user_id: userId },
        }).catch(e => console.error("Trainer referral error:", e));
      }

      supabase.functions.invoke("send-email", {
        body: { type: "trainer_welcome", to: form.email, data: { name: form.fullName } },
      }).catch(e => console.error("Trainer welcome email error:", e));

      supabase.functions.invoke("profile-matching", {
        body: { new_user_id: userId, role: "trainer" },
      }).catch(e => console.error("Trainer profile matching error:", e));

      toast({ title: "Application submitted!", description: "We'll review your profile within 48 hours. Check your email for a welcome message." });
      navigate("/trainer/signup/thankyou");
    } catch (err: any) {
      console.error("Trainer signup error:", err);
      toast({ title: "Signup failed", description: getAuthErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const progress = getStepProgress(step);
  const remaining = progress.total - progress.filled;

  return (
    <div className="min-h-screen bg-background">
      {/* Left Panel - Fixed */}
      <div className="hidden lg:flex fixed top-0 left-0 w-[40%] h-screen hero-gradient items-center justify-center p-12 overflow-hidden z-10">
        <div className="max-w-md">
          <SkillMitraLogo darkText={false} height={40} className="mb-12" />
          <h2 className="text-3xl font-bold text-primary-foreground">
            {step === 0 && "Start earning from your expertise"}
            {step === 1 && "Average trainer earns ₹25,000/month"}
            {step === 2 && "You are in control of your schedule"}
            {step === 3 && "You are in control of your schedule"}
            {step === 4 && "Almost done — join 50+ verified trainers"}
          </h2>
          <p className="mt-4 text-primary-foreground/60 leading-relaxed">Join verified trainers earning from home teaching skills they love.</p>
          <div className="mt-10 space-y-4">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  i < step ? "gold-gradient text-accent-foreground" : i === step ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary-foreground/5 text-primary-foreground/30"
                }`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm ${i <= step ? "text-primary-foreground" : "text-primary-foreground/30"}`}>{s}</span>
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
            <div className="flex items-center gap-1 mt-4">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "hero-gradient" : "bg-secondary"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Step {step + 1} of {steps.length}: {steps[step]}</p>
          </div>

          {referralCode && step === 0 && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700">
                Referral code <span className="font-bold">{referralCode.toUpperCase()}</span> applied — you'll get ₹500 wallet credit after your first paid session!
              </p>
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground">{steps[step]}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step {step + 1} of {steps.length} — {steps[step]}
          </p>

          {/* Step 0: Personal Info */}
          {step === 0 && (
            <div className="mt-6 space-y-4">
              <GoogleSignInButton label="Sign up with Google" />
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">OR</span></div>
              </div>
              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center gap-3">
                <Label className="text-sm font-medium">Profile Photo</Label>
                <div className="relative">
                  {profilePhotoPreview ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
                      <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                      <button type="button" onClick={removeProfilePhoto}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => profilePhotoRef.current?.click()}
                      className="w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors border-border hover:border-primary/50 bg-muted/50">
                      <Camera className="w-6 h-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Upload</span>
                    </button>
                  )}
                  <input ref={profilePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoSelect} />
                </div>
                <p className="text-[11px] text-muted-foreground">Optional — you can add your photo later from dashboard</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name<RequiredMark /></Label>
                  <Input value={form.fullName} onChange={e => update("fullName", e.target.value)} onBlur={() => markTouched("fullName")} placeholder="Your full name"
                    className={`mt-1.5 h-11 ${touched.fullName ? (form.fullName.trim() ? "border-green-500" : "border-destructive") : ""}`} />
                  {touched.fullName && !form.fullName.trim() && <p className="text-xs text-destructive mt-1">Full name is required</p>}
                </div>
                <div>
                  <Label>Email<RequiredMark /></Label>
                  <Input type="email" value={form.email} onChange={e => { update("email", e.target.value); setEmailTypo(null); }} onBlur={handleEmailBlur} placeholder="you@email.com"
                    className={`mt-1.5 h-11 ${touched.email ? (isEmailFilled ? "border-green-500" : "border-destructive") : ""}`} />
                  {emailError && (
                    <p className="text-xs text-destructive mt-1">
                      {emailError}{" "}
                      {emailError.includes("student login") && <Link to="/student/login" className="font-semibold underline">Student Login</Link>}
                      {emailError.includes("login instead") && <Link to="/trainer/login" className="font-semibold underline">Login here</Link>}
                    </p>
                  )}
                  {!emailError && touched.email && !isValidEmail(form.email) && form.email.length > 0 && <p className="text-xs text-destructive mt-1">Please enter a valid email address</p>}
                  {emailTypo && <p className="text-xs text-amber-600 mt-1">{emailTypo}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone<RequiredMark /></Label>
                  <div className="relative">
                    <Input value={form.phone} onChange={e => handlePhoneChange(e.target.value)} onBlur={() => markTouched("phone")} placeholder="9876543210" maxLength={10} inputMode="numeric"
                      className={`mt-1.5 h-11 pr-8 ${touched.phone ? (isPhoneFilled ? "border-green-500" : "border-destructive") : ""}`} />
                    {isPhoneFilled && <CheckCircle2 className="w-4 h-4 text-green-500 absolute right-3 top-1/2 mt-[3px] -translate-y-1/2" />}
                  </div>
                  {touched.phone && !isPhoneFilled && form.phone.length > 0 && <p className="text-xs text-destructive mt-1">Please enter a valid 10-digit Indian mobile number</p>}
                  {touched.phone && !form.phone && <p className="text-xs text-destructive mt-1">Phone is required</p>}
                </div>
                <div>
                  <Label>City<RequiredMark /></Label>
                  <Input value={form.city} onChange={e => update("city", e.target.value)} onBlur={() => markTouched("city")} placeholder="Your city"
                    className={`mt-1.5 h-11 ${touched.city ? (form.city.trim() ? "border-green-500" : "border-destructive") : ""}`} />
                  {touched.city && !form.city.trim() && <p className="text-xs text-destructive mt-1">City is required</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div>
                  <Label>Gender<RequiredMark /></Label>
                  <Select value={form.gender} onValueChange={v => { update("gender", v); markTouched("gender"); }}>
                    <SelectTrigger className={`mt-1.5 h-11 ${touched.gender ? (form.gender ? "border-green-500" : "border-destructive") : ""}`}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                  </Select>
                  {touched.gender && !form.gender && <p className="text-xs text-destructive mt-1">Gender is required</p>}
                </div>
              </div>
              <div>
                <Label>Password<RequiredMark /></Label>
                <div className="relative mt-1.5">
                  <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)} onBlur={() => markTouched("password")} placeholder="Min 8 characters" className="h-11 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={form.password} confirmPassword={confirmPassword} showConfirm />
              </div>
              <div>
                <Label>Confirm Password<RequiredMark /></Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onBlur={() => markTouched("confirmPassword")} placeholder="Re-enter password" className="mt-1.5 h-11" />
              </div>
              <div>
                <Label>Referral Code <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} placeholder="e.g. TM-A1B2C3" className="mt-1.5 h-11 font-mono uppercase" maxLength={10} />
                <p className="text-xs text-muted-foreground mt-1">Got a code from another trainer? Enter it here.</p>
              </div>
            </div>
          )}

          {/* Step 1: Skills & Experience */}
          {step === 1 && (
            <div className="mt-6 space-y-5">
              <div>
                <Label>Skills You Can Teach<RequiredMark /></Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skillOptions.map(s => (
                    <button key={s} type="button" onClick={() => toggleSkill(s)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${skills.includes(s) ? "hero-gradient text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                {stepAttempted[1] && skills.length === 0 && <p className="text-xs text-destructive mt-1">Select at least one skill</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Years of Experience<RequiredMark /></Label>
                  <Input type="number" value={form.experience} onChange={e => update("experience", e.target.value)} onBlur={() => markTouched("experience")} placeholder="e.g. 5"
                    className={`mt-1.5 h-11 ${touched.experience ? (form.experience.trim() ? "border-green-500" : "border-destructive") : ""}`} />
                  {touched.experience && !form.experience.trim() && <p className="text-xs text-destructive mt-1">Experience is required</p>}
                </div>
                <div>
                  <Label>Current Role<RequiredMark /></Label>
                  <Input value={form.currentRole} onChange={e => update("currentRole", e.target.value)} onBlur={() => markTouched("currentRole")} placeholder="e.g. Senior Developer"
                    className={`mt-1.5 h-11 ${touched.currentRole ? (form.currentRole.trim() ? "border-green-500" : "border-destructive") : ""}`} />
                  {touched.currentRole && !form.currentRole.trim() && <p className="text-xs text-destructive mt-1">Current role is required</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Current Company<RequiredMark /></Label>
                  <Input value={form.currentCompany} onChange={e => update("currentCompany", e.target.value)} onBlur={() => markTouched("currentCompany")} placeholder="e.g. Google"
                    className={`mt-1.5 h-11 ${touched.currentCompany ? (form.currentCompany.trim() ? "border-green-500" : "border-destructive") : ""}`} />
                  {touched.currentCompany && !form.currentCompany.trim() && <p className="text-xs text-destructive mt-1">Current company is required</p>}
                </div>
                <div>
                  <Label>LinkedIn Profile URL</Label>
                  <Input value={form.linkedinUrl} onChange={e => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/you" className="mt-1.5 h-11" />
                </div>
              </div>
              <div>
                <Label>Teaching Languages<RequiredMark /></Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {langOptions.map(l => (
                    <button key={l} type="button" onClick={() => toggleLang(l)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${teachLangs.includes(l) ? "gold-gradient text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                      {l}
                    </button>
                  ))}
                </div>
                {stepAttempted[1] && teachLangs.length === 0 && <p className="text-xs text-destructive mt-1">Select at least one language</p>}
              </div>
              <div>
                <Label>Bio (150 words max)<RequiredMark /></Label>
                <Textarea value={form.bio} onChange={e => update("bio", e.target.value)} onBlur={() => markTouched("bio")} placeholder="Tell students about your teaching experience and approach..." className="mt-1.5 min-h-[120px]" maxLength={900} />
                {touched.bio && !form.bio.trim() && <p className="text-xs text-destructive mt-1">Bio is required</p>}
              </div>
              <div>
                <Label>Previous Companies <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={form.previousCompanies} onChange={e => update("previousCompanies", e.target.value)} placeholder="e.g. Amazon, TCS, Infosys (comma separated)" className="mt-1.5 h-11" />
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <div className="mt-6 space-y-5">
              <p className="text-sm text-muted-foreground">Upload documents for verification. Government ID is required. All other documents are optional.</p>
              {docTypes.map(doc => (
                <div key={doc.key} className={`border rounded-xl p-4 transition-colors ${
                  doc.required && stepAttempted[2] && !docs[doc.key]?.file ? "border-destructive border-solid" : "border-dashed border-border hover:border-primary/30"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.label}{doc.required && <RequiredMark />}</p>
                      {docs[doc.key] ? (
                        <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1"><FileCheck className="w-3 h-3" />{docs[doc.key].name}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG, PNG up to 10MB</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={el => { fileRefs.current[doc.key] = el; }}
                        accept={doc.accept}
                        className="hidden"
                        onChange={e => handleFileSelect(doc.key, e.target.files?.[0] || null)}
                      />
                      <Button variant="outline" size="sm" onClick={() => fileRefs.current[doc.key]?.click()}>
                        <Upload className="w-4 h-4 mr-2" />{docs[doc.key] ? "Change" : "Upload"}
                      </Button>
                    </div>
                  </div>
                  {doc.required && stepAttempted[2] && !docs[doc.key]?.file && <p className="text-xs text-destructive mt-2">Government ID is required for verification</p>}
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Availability */}
          {step === 3 && (
            <div className="mt-6 space-y-5">
              <p className="text-sm text-muted-foreground">Select your weekly available time slots. At least one slot is required.</p>
              {stepAttempted[3] && !Object.values(availability).some(v => v.checked) && (
                <p className="text-xs text-destructive">Select at least one availability slot</p>
              )}
              <div className="space-y-3">
                {Object.entries(availability).map(([day, val]) => (
                  <div key={day} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                    <input type="checkbox" className="accent-primary w-4 h-4" checked={val.checked} onChange={e => updateAvail(day, "checked", e.target.checked)} />
                    <span className="text-sm font-medium text-foreground w-24">{day}</span>
                    <Select value={val.start} onValueChange={v => updateAvail(day, "start", v)}>
                      <SelectTrigger className="h-9 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">to</span>
                    <Select value={val.end} onValueChange={v => updateAvail(day, "end", v)}>
                      <SelectTrigger className="h-9 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["12:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Bank Details (all optional) */}
          {step === 4 && (
            <div className="mt-6 space-y-5">
              <p className="text-sm text-muted-foreground">Add your bank details for receiving payouts. All fields are optional — you can add them later from your dashboard.</p>
              <div><Label>Account Holder Name</Label><Input value={form.accountHolderName} onChange={e => update("accountHolderName", e.target.value)} placeholder="Name as per bank account" className="mt-1.5 h-11" /></div>
              <div><Label>Bank Account Number</Label><Input value={form.bankAccount} onChange={e => update("bankAccount", e.target.value)} placeholder="Account number" className="mt-1.5 h-11" /></div>
              <div><Label>IFSC Code</Label><Input value={form.ifsc} onChange={e => update("ifsc", e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" className="mt-1.5 h-11 uppercase" /></div>
              <div><Label>UPI ID</Label><Input value={form.upiId} onChange={e => update("upiId", e.target.value)} placeholder="e.g. yourname@upi" className="mt-1.5 h-11" /></div>
              <div><Label>PAN Number</Label><Input value={form.panNumber} onChange={e => update("panNumber", e.target.value.toUpperCase())} placeholder="e.g. ABCDE1234F" className="mt-1.5 h-11 uppercase" /></div>
              <label className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="accent-primary mt-1 w-4 h-4" />
                <span className="text-sm text-muted-foreground">I declare that all information provided is accurate. I agree to SkillMitra's Terms of Service and understand that my profile will be reviewed before approval.</span>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <Button onClick={nextStep} className="hero-gradient border-0">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || !agreed} className="gold-gradient text-accent-foreground border-0 font-semibold">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <>Submit Application <ArrowRight className="ml-2 w-4 h-4" /></>}
              </Button>
            )}
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
