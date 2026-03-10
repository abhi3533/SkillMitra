import { useState, useRef, useEffect, Suspense, lazy } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Check, ChevronRight, ChevronLeft, Upload, FileCheck, Loader2, CheckCircle2, Camera, X, Gift, Shield, Info, AlertTriangle, Star, Wifi, Webcam as WebcamIcon, Mic, Volume2, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { cleanPhone, isValidPhone, isValidEmail, getEmailTypoSuggestion } from "@/lib/formValidation";
import PasswordStrengthIndicator, { isPasswordValid } from "@/components/auth/PasswordStrengthIndicator";
import SkillMitraLogo from "@/components/SkillMitraLogo";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import TrainerBadges, { getTrainerBadges } from "@/components/TrainerBadges";

const stateOptions = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

const expertiseOptions = [
  "Web Development", "Mobile Development", "Data Science", "Machine Learning",
  "UI/UX Design", "Digital Marketing", "Content Writing", "Graphic Design",
  "Project Management", "Cloud Computing", "DevOps", "Cybersecurity",
  "Business Analysis", "Product Management", "Sales", "HR Management", "Finance"
];

const steps = ["Personal Details", "Experience", "Course Details", "Services & Materials", "Payment & Documents", "Referral & Declaration"];

const stepHeadings = [
  "Start earning from your expertise",
  "Show us your professional journey",
  "Design your 1-on-1 course",
  "Go beyond just teaching",
  "Almost done — set up payouts",
  "Join 50+ verified trainers"
];

interface DocFile { file: File | null; name: string; }

const RequiredMark = () => <span className="text-destructive ml-0.5">*</span>;

const TrainerSignup = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: "", dob: "", gender: "", phone: "", whatsapp: "", email: "", password: "",
    address: "", city: "", state: "", pincode: "", linkedinUrl: "", portfolioUrl: "",
    experience: "", currentRole: "", currentCompany: "", primarySkill: "", secondarySkill: "", workEmail: "",
    verificationMethod: "", verificationValue: "",
    courseTitle: "", courseDuration: "", courseFee: "", courseDescription: "",
    additionalServicesDetails: "", courseMaterials: "",
    bankAccount: "", ifsc: "", accountHolderName: "", upiId: "", govtIdType: "",
    referralCode: searchParams.get("ref") || "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailTypo, setEmailTypo] = useState<string | null>(null);
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedTraining, setAgreedTraining] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [readinessChecks, setReadinessChecks] = useState<Record<string, boolean>>({
    internet: false, webcam: false, microphone: false, environment: false, response: false, cancel: false,
  });
  const [docs, setDocs] = useState<Record<string, DocFile>>({});
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const profilePhotoRef = useRef<HTMLInputElement | null>(null);
  const selfieRef = useRef<HTMLInputElement | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [stepAttempted, setStepAttempted] = useState<Record<number, boolean>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));
  const markTouched = (key: string) => setTouched(t => ({ ...t, [key]: true }));

  const handlePhoneChange = (val: string) => {
    const cleaned = cleanPhone(val);
    update("phone", cleaned);
    if (sameAsPhone) update("whatsapp", cleaned);
  };
  const handleSameAsPhone = (checked: boolean) => {
    setSameAsPhone(checked);
    if (checked) update("whatsapp", form.phone);
  };
  const handleEmailBlur = () => {
    markTouched("email");
    setEmailTypo(getEmailTypoSuggestion(form.email));
    checkDuplicateEmail(form.email);
  };

  const handleFileSelect = (docKey: string, file: File | null) => {
    if (file) setDocs(prev => ({ ...prev, [docKey]: { file, name: file.name } }));
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
  const hasLetters = (val: string) => /[a-zA-Z]/.test(val);
  const isValidName = (val: string) => /^[a-zA-Z\s.'-]+$/.test(val.trim());
  const isValidIFSC = (val: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val);
  const isValidPincode = (val: string) => /^\d{6}$/.test(val);

  const handleProfilePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast({ title: "Photo must be less than 5MB", variant: "warning" }); return; }
      setProfilePhoto(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };
  const removeProfilePhoto = () => { setProfilePhoto(null); setProfilePhotoPreview(null); if (profilePhotoRef.current) profilePhotoRef.current.value = ""; };

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast({ title: "Photo must be less than 5MB", variant: "warning" }); return; }
      setSelfie(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };
  const removeSelfie = () => { setSelfie(null); setSelfiePreview(null); if (selfieRef.current) selfieRef.current.value = ""; };

  const toggleReadiness = (key: string) => setReadinessChecks(p => ({ ...p, [key]: !p[key] }));
  const allReadinessChecked = Object.values(readinessChecks).every(Boolean);

  const previewBadges = getTrainerBadges({
    hasAadhaar: !!docs["aadhaar"]?.file || !!form.govtIdType,
    hasExperienceDocs: !!(docs["joining_letter"]?.file || docs["relieving_letter"]?.file || docs["experience_letter"]?.file),
    hasDemoVideo: !!docs["demo_video"]?.file,
  });

  const toggleExpertise = (e: string) => setExpertiseAreas(p => p.includes(e) ? p.filter(x => x !== e) : [...p, e]);
  const toggleService = (s: string) => setServicesOffered(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const validateStep = (s: number): boolean => {
    setStepAttempted(p => ({ ...p, [s]: true }));
    if (s === 0) {
      const allKeys = ["fullName", "dob", "gender", "phone", "whatsapp", "email", "city", "state", "pincode", "address", "password", "confirmPassword"];
      const newTouched: Record<string, boolean> = { ...touched };
      allKeys.forEach(k => newTouched[k] = true);
      setTouched(newTouched);
      if (!form.fullName.trim()) { toast({ title: "Full name is required", variant: "warning" }); return false; }
      if (!isValidName(form.fullName)) { toast({ title: "Please enter a valid name", variant: "warning" }); return false; }
      if (!form.dob) { toast({ title: "Date of birth is required", variant: "warning" }); return false; }
      if (!form.gender) { toast({ title: "Gender is required", variant: "warning" }); return false; }
      if (!isValidPhone(form.phone)) { toast({ title: "Valid 10-digit Indian mobile number required", variant: "warning" }); return false; }
      if (!isValidPhone(form.whatsapp)) { toast({ title: "Valid WhatsApp number required", variant: "warning" }); return false; }
      if (!isValidEmail(form.email) || emailError) { toast({ title: "Valid email is required", variant: "warning" }); return false; }
      if (!selfie) { toast({ title: "Selfie upload is required for verification", variant: "warning" }); return false; }
      if (!form.address.trim()) { toast({ title: "Complete address is required", variant: "warning" }); return false; }
      if (!form.city.trim()) { toast({ title: "City is required", variant: "warning" }); return false; }
      if (!form.state) { toast({ title: "State is required", variant: "warning" }); return false; }
      if (!isValidPincode(form.pincode)) { toast({ title: "Valid 6-digit PIN code required", variant: "warning" }); return false; }
      if (!isPasswordValid(form.password)) { toast({ title: "Password doesn't meet requirements", variant: "warning" }); return false; }
      if (form.password !== confirmPassword) { toast({ title: "Passwords do not match", variant: "warning" }); return false; }
    }
    if (s === 1) {
      if (!form.experience.trim()) { toast({ title: "Total experience is required", variant: "warning" }); return false; }
      if (!form.currentRole.trim() || !hasLetters(form.currentRole)) { toast({ title: "Valid current role is required", variant: "warning" }); return false; }
      if (!form.currentCompany.trim() || !hasLetters(form.currentCompany)) { toast({ title: "Valid company name is required", variant: "warning" }); return false; }
      if (!form.primarySkill.trim()) { toast({ title: "Primary skill is required", variant: "warning" }); return false; }
      if (!form.verificationMethod || !form.verificationValue.trim()) { toast({ title: "At least one professional verification is required", variant: "warning" }); return false; }
    }
    if (s === 2) {
      if (!docs["demo_video"]?.file) { toast({ title: "Course demo video is required (5-10 min)", variant: "warning" }); return false; }
      if (!form.courseTitle.trim()) { toast({ title: "Course title is required", variant: "warning" }); return false; }
      if (!form.courseDuration.trim()) { toast({ title: "Course duration is required", variant: "warning" }); return false; }
      if (!form.courseFee.trim() || parseInt(form.courseFee) < 500) { toast({ title: "Course fee must be minimum ₹500", variant: "warning" }); return false; }
      if (!form.courseDescription.trim() || form.courseDescription.trim().length < 100) { toast({ title: "Course description must be at least 100 characters", variant: "warning" }); return false; }
    }
    // Step 3 (services) — all optional
    if (s === 4) {
      if (!form.bankAccount.trim()) { toast({ title: "Bank account number is required", variant: "warning" }); return false; }
      if (!form.ifsc.trim() || !isValidIFSC(form.ifsc)) { toast({ title: "Valid IFSC code is required (e.g. SBIN0001234)", variant: "warning" }); return false; }
      if (!form.accountHolderName.trim()) { toast({ title: "Account holder name is required", variant: "warning" }); return false; }
      if (!form.govtIdType) { toast({ title: "Government ID type is required", variant: "warning" }); return false; }
      if (!docs["aadhaar"]?.file) { toast({ title: "Aadhaar document upload is required", variant: "warning" }); return false; }
    }
    if (s === 5) {
      if (!agreedTraining) { toast({ title: "Please confirm 1-on-1 training commitment", variant: "warning" }); return false; }
      if (!agreedTerms) { toast({ title: "Please agree to Terms and Conditions", variant: "warning" }); return false; }
      if (!allReadinessChecked) { toast({ title: "Please confirm all teaching readiness items", variant: "warning" }); return false; }
    }
    return true;
  };

  const nextStep = () => { if (validateStep(step)) setStep(step + 1); };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;
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

      // Upload profile photo
      let profilePictureUrl: string | null = null;
      if (profilePhoto) {
        const ext = profilePhoto.name.split('.').pop();
        const photoPath = `${userId}/profile.${ext}`;
        const { error: photoErr } = await supabase.storage.from("profile-pictures").upload(photoPath, profilePhoto, { upsert: true });
        if (!photoErr) { const { data: u } = supabase.storage.from("profile-pictures").getPublicUrl(photoPath); profilePictureUrl = u.publicUrl; }
      }

      // Upload selfie
      let selfieUrl: string | null = null;
      if (selfie) {
        const ext = selfie.name.split('.').pop();
        const selfiePath = `${userId}/selfie.${ext}`;
        const { error: sErr } = await supabase.storage.from("trainer-documents").upload(selfiePath, selfie, { upsert: true });
        if (!sErr) { selfieUrl = selfiePath; }
      }

      // Upload docs
      let demoVideoUrl: string | null = null;
      let introVideoUrl: string | null = null;
      let curriculumPdfUrl: string | null = null;
      let aadhaarUrl: string | null = null;
      const uploadedDocs: { document_type: string; document_name: string; document_url: string }[] = [];

      for (const [key, docFile] of Object.entries(docs)) {
        if (!docFile?.file) continue;
        const ext = docFile.file.name.split('.').pop();
        const bucket = key === "demo_video" || key === "intro_video" ? "intro-videos" : "trainer-documents";
        const path = `${userId}/${key}.${ext}`;
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, docFile.file, { upsert: true });
        if (upErr) { console.error(`Upload failed for ${key}:`, upErr); continue; }
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        if (key === "demo_video") demoVideoUrl = urlData.publicUrl;
        else if (key === "intro_video") introVideoUrl = urlData.publicUrl;
        else if (key === "curriculum_pdf") curriculumPdfUrl = urlData.publicUrl;
        else if (key === "aadhaar") aadhaarUrl = urlData.publicUrl;
        else uploadedDocs.push({ document_type: key, document_name: docFile.name, document_url: urlData.publicUrl });
      }

      const { error: completeErr } = await supabase.functions.invoke("complete-signup", {
        body: {
          user_id: userId,
          role: "trainer",
          trainer_data: {
            bio: form.courseDescription,
            skills: [form.primarySkill, form.secondarySkill].filter(Boolean),
            teaching_languages: [],
            experience_years: parseInt(form.experience) || 0,
            current_role: form.currentRole,
            current_company: form.currentCompany,
            linkedin_url: form.linkedinUrl || null,
            previous_companies: [],
            bank_account_number: form.bankAccount || null,
            ifsc_code: form.ifsc || null,
            upi_id: form.upiId || null,
            pan_number: null,
            account_holder_name: form.accountHolderName || null,
            intro_video_url: introVideoUrl,
            profile_picture_url: profilePictureUrl,
            documents: uploadedDocs,
            // New fields
            dob: form.dob || null,
            whatsapp: form.whatsapp || null,
            selfie_url: selfieUrl,
            address: form.address || null,
            pincode: form.pincode || null,
            portfolio_url: form.portfolioUrl || null,
            secondary_skill: form.secondarySkill || null,
            work_email: form.workEmail || null,
            expertise_areas: expertiseAreas,
            demo_video_url: demoVideoUrl,
            curriculum_pdf_url: curriculumPdfUrl,
            services_offered: servicesOffered,
            course_materials: form.courseMaterials || null,
            govt_id_type: form.govtIdType || null,
            aadhaar_url: aadhaarUrl,
            additional_services_details: form.additionalServicesDetails || null,
            course_title: form.courseTitle || null,
            course_duration: form.courseDuration || null,
            course_fee: parseFloat(form.courseFee) || 0,
            course_description: form.courseDescription || null,
            verification_method: form.verificationMethod || null,
            verification_value: form.verificationValue || null,
          },
        },
      });
      if (completeErr) console.error("Complete signup error:", completeErr);

      const trimmedRef = form.referralCode.trim().toUpperCase();
      if (trimmedRef) {
        supabase.functions.invoke("process-trainer-referral", { body: { referral_code: trimmedRef, new_user_id: userId } }).catch(console.error);
      }

      supabase.functions.invoke("send-email", { body: { type: "trainer_welcome", to: form.email, data: { name: form.fullName } } }).catch(console.error);
      supabase.functions.invoke("notify-admin-new-trainer", {
        body: { user_id: userId, trainer_name: form.fullName, email: form.email, phone: form.phone, city: form.city, skills: [form.primarySkill], experience_years: parseInt(form.experience) || 0 },
      }).catch(console.error);

      toast({ title: "Application submitted!", description: "We'll review your profile within 24 hours.", variant: "success" });
      navigate("/trainer/signup/thankyou");
    } catch (err: any) {
      console.error("Trainer signup error:", err);
      toast({ title: "Signup failed", description: getAuthErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const FileUploadBox = ({ docKey, label, required, accept, hint }: { docKey: string; label: string; required?: boolean; accept: string; hint?: string }) => (
    <div className={`border rounded-xl p-4 transition-colors ${required && stepAttempted[step] && !docs[docKey]?.file ? "border-destructive" : "border-dashed border-border hover:border-primary/30"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{label}{required && <RequiredMark />}</p>
          {docs[docKey] ? (
            <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1"><FileCheck className="w-3 h-3" />{docs[docKey].name}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">{hint || "PDF, JPG, PNG up to 10MB"}</p>
          )}
        </div>
        <div>
          <input type="file" ref={el => { fileRefs.current[docKey] = el; }} accept={accept} className="hidden" onChange={e => handleFileSelect(docKey, e.target.files?.[0] || null)} />
          <Button variant="outline" size="sm" onClick={() => fileRefs.current[docKey]?.click()}><Upload className="w-4 h-4 mr-2" />{docs[docKey] ? "Change" : "Upload"}</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Left Panel - Fixed */}
      <div className="hidden lg:flex fixed top-0 left-0 w-[40%] h-screen hero-gradient items-center justify-center p-12 overflow-hidden z-10">
        <div className="max-w-md">
          <SkillMitraLogo darkText={false} height={40} className="mb-12" />
          <h2 className="text-3xl font-bold text-primary-foreground">{stepHeadings[step]}</h2>
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

          <h1 className="text-2xl font-bold text-foreground">{steps[step]}</h1>
          <p className="text-sm text-muted-foreground mt-1">Step {step + 1} of {steps.length} — {steps[step]}</p>

          {/* ========== STEP 0: Personal Details ========== */}
          {step === 0 && (
            <div className="mt-6 space-y-4">
              <GoogleSignInButton label="Sign up with Google" />
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">OR</span></div>
              </div>

              {/* Profile Photo & Selfie */}
              <div className="flex gap-6 items-start justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Label className="text-xs font-medium">Profile Photo</Label>
                  <div className="relative">
                    {profilePhotoPreview ? (
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary">
                        <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                        <button type="button" onClick={removeProfilePhoto} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => profilePhotoRef.current?.click()} className="w-20 h-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-1 border-border hover:border-primary/50 bg-muted/50">
                        <Camera className="w-5 h-5 text-muted-foreground" /><span className="text-[9px] text-muted-foreground">Optional</span>
                      </button>
                    )}
                    <input ref={profilePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoSelect} />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Label className="text-xs font-medium">Selfie<RequiredMark /></Label>
                  <div className="relative">
                    {selfiePreview ? (
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary">
                        <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                        <button type="button" onClick={removeSelfie} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => selfieRef.current?.click()} className="w-20 h-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-1 border-destructive/50 hover:border-destructive bg-muted/50">
                        <Camera className="w-5 h-5 text-muted-foreground" /><span className="text-[9px] text-destructive">Required</span>
                      </button>
                    )}
                    <input ref={selfieRef} type="file" accept="image/*" className="hidden" onChange={handleSelfieSelect} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name<RequiredMark /></Label>
                  <Input value={form.fullName} onChange={e => update("fullName", e.target.value)} onBlur={() => markTouched("fullName")} placeholder="Your full name"
                    className={`mt-1.5 h-11 ${touched.fullName ? (form.fullName.trim() && isValidName(form.fullName) ? "border-green-500" : "border-destructive") : ""}`} />
                  {touched.fullName && !form.fullName.trim() && <p className="text-xs text-destructive mt-1">Required</p>}
                </div>
                <div>
                  <Label>Date of Birth<RequiredMark /></Label>
                  <Input type="date" value={form.dob} onChange={e => update("dob", e.target.value)} onBlur={() => markTouched("dob")}
                    className={`mt-1.5 h-11 ${touched.dob ? (form.dob ? "border-green-500" : "border-destructive") : ""}`} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Gender<RequiredMark /></Label>
                  <Select value={form.gender} onValueChange={v => { update("gender", v); markTouched("gender"); }}>
                    <SelectTrigger className={`mt-1.5 h-11 ${touched.gender ? (form.gender ? "border-green-500" : "border-destructive") : ""}`}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phone Number<RequiredMark /></Label>
                  <Input value={form.phone} onChange={e => handlePhoneChange(e.target.value)} onBlur={() => markTouched("phone")} placeholder="9876543210" maxLength={10} inputMode="numeric"
                    className={`mt-1.5 h-11 ${touched.phone ? (isPhoneFilled ? "border-green-500" : "border-destructive") : ""}`} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>WhatsApp Number<RequiredMark /></Label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Checkbox checked={sameAsPhone} onCheckedChange={handleSameAsPhone} className="w-3.5 h-3.5" />
                    Same as phone
                  </label>
                </div>
                <Input value={form.whatsapp} onChange={e => { update("whatsapp", cleanPhone(e.target.value)); setSameAsPhone(false); }} placeholder="9876543210" maxLength={10} inputMode="numeric" disabled={sameAsPhone}
                  className={`mt-1.5 h-11 ${sameAsPhone ? "bg-muted" : ""}`} />
              </div>

              <div>
                <Label>Email<RequiredMark /></Label>
                <Input type="email" value={form.email} onChange={e => { update("email", e.target.value); setEmailTypo(null); }} onBlur={handleEmailBlur} placeholder="you@email.com"
                  className={`mt-1.5 h-11 ${touched.email ? (isEmailFilled ? "border-green-500" : "border-destructive") : ""}`} />
                {emailError && <p className="text-xs text-destructive mt-1">{emailError}</p>}
                {emailTypo && <p className="text-xs text-amber-600 mt-1">{emailTypo}</p>}
              </div>

              <div>
                <Label>Complete Address<RequiredMark /></Label>
                <Textarea value={form.address} onChange={e => update("address", e.target.value)} onBlur={() => markTouched("address")} placeholder="House/Flat No, Street, Area, Landmark" className="mt-1.5 min-h-[70px]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>City<RequiredMark /></Label>
                  <Input value={form.city} onChange={e => update("city", e.target.value)} onBlur={() => markTouched("city")} placeholder="City" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label>State<RequiredMark /></Label>
                  <Select value={form.state} onValueChange={v => { update("state", v); markTouched("state"); }}>
                    <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>{stateOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>PIN Code<RequiredMark /></Label>
                  <Input value={form.pincode} onChange={e => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} onBlur={() => markTouched("pincode")} placeholder="6 digits" maxLength={6} inputMode="numeric" className="mt-1.5 h-11" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>LinkedIn Profile <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input value={form.linkedinUrl} onChange={e => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/you" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label>Portfolio Website <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input value={form.portfolioUrl} onChange={e => update("portfolioUrl", e.target.value)} placeholder="https://yoursite.com" className="mt-1.5 h-11" />
                </div>
              </div>

              <div>
                <Label>Password<RequiredMark /></Label>
                <div className="relative mt-1.5">
                  <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)} placeholder="Min 8 characters" className="h-11 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                <PasswordStrengthIndicator password={form.password} confirmPassword={confirmPassword} showConfirm />
              </div>
              <div>
                <Label>Confirm Password<RequiredMark /></Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="mt-1.5 h-11" />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <Shield className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">Your data is encrypted and protected.</p>
              </div>
            </div>
          )}

          {/* ========== STEP 1: Experience ========== */}
          {step === 1 && (
            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Total Experience (Years)<RequiredMark /></Label>
                  <Input type="number" value={form.experience} onChange={e => update("experience", e.target.value)} onBlur={() => markTouched("experience")} placeholder="e.g. 5" className="mt-1.5 h-11" min="0" />
                </div>
                <div>
                  <Label>Current Role<RequiredMark /></Label>
                  <Input value={form.currentRole} onChange={e => update("currentRole", e.target.value)} onBlur={() => markTouched("currentRole")} placeholder="e.g. Senior Developer" className="mt-1.5 h-11" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Current/Previous Company<RequiredMark /></Label>
                  <Input value={form.currentCompany} onChange={e => update("currentCompany", e.target.value)} onBlur={() => markTouched("currentCompany")} placeholder="e.g. Google" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label>Work Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input type="email" value={form.workEmail} onChange={e => update("workEmail", e.target.value)} placeholder="you@company.com" className="mt-1.5 h-11" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Primary Skill<RequiredMark /></Label>
                  <Input value={form.primarySkill} onChange={e => update("primarySkill", e.target.value)} onBlur={() => markTouched("primarySkill")} placeholder="e.g. React.js" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label>Secondary Skill <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input value={form.secondarySkill} onChange={e => update("secondarySkill", e.target.value)} placeholder="e.g. Node.js" className="mt-1.5 h-11" />
                </div>
              </div>

              <div>
                <Label>Areas of Expertise</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {expertiseOptions.map(e => (
                    <button key={e} type="button" onClick={() => toggleExpertise(e)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${expertiseAreas.includes(e) ? "hero-gradient text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Documents Upload <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <FileUploadBox docKey="joining_letter" label="Joining Letter" accept=".pdf,.jpg,.jpeg,.png" />
                <FileUploadBox docKey="relieving_letter" label="Relieving Letter" accept=".pdf,.jpg,.jpeg,.png" />
                <FileUploadBox docKey="experience_letter" label="Experience Letter" accept=".pdf,.jpg,.jpeg,.png" />
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                <Label className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Professional Verification<RequiredMark /></Label>
                <p className="text-xs text-muted-foreground">At least one verification method is required</p>
                <Select value={form.verificationMethod} onValueChange={v => update("verificationMethod", v)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select verification method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_email">Company Email</SelectItem>
                    <SelectItem value="employee_id">Employee ID</SelectItem>
                    <SelectItem value="client_references">Client References</SelectItem>
                  </SelectContent>
                </Select>
                {form.verificationMethod && (
                  <Input value={form.verificationValue} onChange={e => update("verificationValue", e.target.value)}
                    placeholder={form.verificationMethod === "company_email" ? "you@company.com" : form.verificationMethod === "employee_id" ? "Your Employee ID" : "Client name & contact details"}
                    className="h-11" />
                )}
              </div>
            </div>
          )}

          {/* ========== STEP 2: Course Details ========== */}
          {step === 2 && (
            <div className="mt-6 space-y-5">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Important Notice</p>
                  <p className="text-xs text-amber-700 mt-1">SkillMitra supports only <strong>1-on-1 personalized training</strong>. No batch classes, recorded sessions, or group training allowed.</p>
                </div>
              </div>

              <FileUploadBox docKey="demo_video" label="Course Demo Video (5-10 min)" required accept="video/*" hint="Video file, max 100MB" />
              <FileUploadBox docKey="intro_video" label="About Yourself Video (2-3 min)" accept="video/*" hint="Optional intro video" />
              <FileUploadBox docKey="curriculum_pdf" label="Course Curriculum PDF" accept=".pdf" hint="Optional PDF document" />

              <div>
                <Label>Course Title<RequiredMark /></Label>
                <Input value={form.courseTitle} onChange={e => update("courseTitle", e.target.value)} onBlur={() => markTouched("courseTitle")} placeholder="e.g. Full Stack Web Development with React & Node.js" className="mt-1.5 h-11" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Course Duration<RequiredMark /></Label>
                  <Input value={form.courseDuration} onChange={e => update("courseDuration", e.target.value)} onBlur={() => markTouched("courseDuration")} placeholder="e.g. 3 months / 24 sessions" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label>Course Fee (₹)<RequiredMark /></Label>
                  <Input type="number" value={form.courseFee} onChange={e => update("courseFee", e.target.value)} onBlur={() => markTouched("courseFee")} placeholder="Min ₹500" className="mt-1.5 h-11" min="500" />
                  {touched.courseFee && form.courseFee && parseInt(form.courseFee) < 500 && <p className="text-xs text-destructive mt-1">Minimum fee is ₹500</p>}
                </div>
              </div>
              <div>
                <Label>Course Description<RequiredMark /></Label>
                <Textarea value={form.courseDescription} onChange={e => update("courseDescription", e.target.value)} onBlur={() => markTouched("courseDescription")} placeholder="Describe what students will learn, prerequisites, outcomes..." className="mt-1.5 min-h-[120px]" />
                <p className="text-xs text-muted-foreground mt-1">{form.courseDescription.length}/100 characters minimum</p>
              </div>

              {/* Preview Your Profile Button */}
              <Button type="button" variant="outline" className="w-full mt-4 border-primary text-primary hover:bg-primary/5" onClick={() => setShowPreview(true)}>
                <Eye className="w-4 h-4 mr-2" /> Preview Your Profile
              </Button>
            </div>
          )}

          {/* ========== STEP 3: Services & Materials ========== */}
          {step === 3 && (
            <div className="mt-6 space-y-5">
              <div>
                <Label>Additional Services You Offer</Label>
                <div className="space-y-3 mt-3">
                  {["Resume Review and Optimization", "Mock Interview Sessions", "Real Time Project Guidance"].map(s => (
                    <label key={s} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary/80 transition-colors">
                      <Checkbox checked={servicesOffered.includes(s)} onCheckedChange={() => toggleService(s)} />
                      <span className="text-sm text-foreground">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Additional Services Details <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea value={form.additionalServicesDetails} onChange={e => update("additionalServicesDetails", e.target.value)} placeholder="Describe your additional services in detail..." className="mt-1.5 min-h-[100px]" />
              </div>
              <div>
                <Label>Course Materials & Resources <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea value={form.courseMaterials} onChange={e => update("courseMaterials", e.target.value)} placeholder="Describe materials you provide — PDFs, code samples, projects, assignments..." className="mt-1.5 min-h-[100px]" />
              </div>
            </div>
          )}

          {/* ========== STEP 4: Payment & Documents ========== */}
          {step === 4 && (
            <div className="mt-6 space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Platform Fee Structure</p>
                  <p className="text-xs text-emerald-700 mt-1">SkillMitra keeps <strong>10% platform fee</strong>. You receive <strong>90% of every course fee</strong>.</p>
                </div>
              </div>

              <div>
                <Label>Bank Account Number<RequiredMark /></Label>
                <Input value={form.bankAccount} onChange={e => update("bankAccount", e.target.value)} onBlur={() => markTouched("bankAccount")} placeholder="Account number" className="mt-1.5 h-11" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>IFSC Code<RequiredMark /></Label>
                  <Input value={form.ifsc} onChange={e => update("ifsc", e.target.value.toUpperCase())} onBlur={() => markTouched("ifsc")} placeholder="e.g. SBIN0001234" className="mt-1.5 h-11 uppercase" maxLength={11} />
                  {touched.ifsc && form.ifsc && !isValidIFSC(form.ifsc) && <p className="text-xs text-destructive mt-1">Invalid IFSC format</p>}
                </div>
                <div>
                  <Label>Account Holder Name<RequiredMark /></Label>
                  <Input value={form.accountHolderName} onChange={e => update("accountHolderName", e.target.value)} onBlur={() => markTouched("accountHolderName")} placeholder="Name as per bank" className="mt-1.5 h-11" />
                </div>
              </div>
              <div>
                <Label>UPI ID <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={form.upiId} onChange={e => update("upiId", e.target.value)} placeholder="yourname@upi" className="mt-1.5 h-11" />
              </div>

              <div className="border-t border-border pt-5 space-y-4">
                <Label>Government ID Type<RequiredMark /></Label>
                <Select value={form.govtIdType} onValueChange={v => { update("govtIdType", v); markTouched("govtIdType"); }}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select ID type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aadhaar">Aadhaar</SelectItem>
                    <SelectItem value="pan">PAN Card</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="driving_license">Driving License</SelectItem>
                  </SelectContent>
                </Select>
                <FileUploadBox docKey="aadhaar" label="Aadhaar Document Upload" required accept=".pdf,.jpg,.jpeg,.png" hint="PDF or image, up to 10MB" />
              </div>
            </div>
          )}

          {/* ========== STEP 5: Referral & Declaration ========== */}
          {step === 5 && (
            <div className="mt-6 space-y-5">
              <div>
                <Label>Referral Code <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={form.referralCode} onChange={e => update("referralCode", e.target.value.toUpperCase())} placeholder="e.g. TM-A1B2C3" className="mt-1.5 h-11 font-mono uppercase" maxLength={10} />
                <div className="mt-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700">Earn <strong>₹1,500 bonus</strong> per successful trainer referral!</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${agreedTraining ? "bg-primary/5 border-primary/30" : "bg-secondary/50 border-border"}`}>
                  <Checkbox checked={agreedTraining} onCheckedChange={(c) => setAgreedTraining(!!c)} className="mt-0.5" />
                  <span className="text-sm text-foreground">I confirm I will only provide <strong>1-on-1 personalized training</strong> sessions.<RequiredMark /></span>
                </label>
                <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${agreedTerms ? "bg-primary/5 border-primary/30" : "bg-secondary/50 border-border"}`}>
                  <Checkbox checked={agreedTerms} onCheckedChange={(c) => setAgreedTerms(!!c)} className="mt-0.5" />
                  <span className="text-sm text-foreground">I agree to SkillMitra <Link to="/terms" className="text-primary underline" target="_blank">Terms and Conditions</Link>.<RequiredMark /></span>
                </label>
              </div>

              {/* Teaching Readiness Checklist */}
              <div className="border-t border-border pt-5 mt-5">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Are You Ready to Teach?<RequiredMark />
                </h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Please confirm all items below before submitting.</p>
                <div className="space-y-2">
                  {[
                    { key: "internet", icon: <Wifi className="w-4 h-4" />, label: "I have a stable internet connection (minimum 10 Mbps)" },
                    { key: "webcam", icon: <Camera className="w-4 h-4" />, label: "I have a working webcam" },
                    { key: "microphone", icon: <Mic className="w-4 h-4" />, label: "I have a working microphone" },
                    { key: "environment", icon: <Volume2 className="w-4 h-4" />, label: "I have a quiet, distraction-free environment" },
                    { key: "response", icon: <MessageSquare className="w-4 h-4" />, label: "I will respond to student messages within 2 hours" },
                    { key: "cancel", icon: <Clock className="w-4 h-4" />, label: "I will not cancel sessions less than 24 hours before scheduled time" },
                  ].map(item => (
                    <label key={item.key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${readinessChecks[item.key] ? "bg-emerald-50 border-emerald-200" : "bg-secondary/50 border-border hover:bg-secondary/80"}`}>
                      <Checkbox checked={readinessChecks[item.key]} onCheckedChange={() => toggleReadiness(item.key)} />
                      <span className="text-muted-foreground">{item.icon}</span>
                      <span className="text-sm text-foreground">{item.label}</span>
                    </label>
                  ))}
                </div>
                {!allReadinessChecked && stepAttempted[5] && (
                  <p className="text-xs text-destructive mt-2">All teaching readiness items must be confirmed</p>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
            ) : <div />}
            {step < 5 ? (
              <Button onClick={nextStep} className="hero-gradient border-0">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || !agreedTraining || !agreedTerms || !allReadinessChecked} className="gold-gradient text-accent-foreground border-0 font-semibold">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <>Submit Application <ArrowRight className="ml-2 w-4 h-4" /></>}
              </Button>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already registered? <Link to="/trainer/login" className="text-primary font-semibold hover:underline">Trainer Login</Link>
          </p>
        </motion.div>
      </div>

      {/* Profile Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Profile Preview</DialogTitle>
            <p className="text-xs text-muted-foreground">This is how students will see you. Make edits before submitting.</p>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Profile Header */}
            <div className="flex items-start gap-4">
              {profilePhotoPreview ? (
                <img src={profilePhotoPreview} alt="Profile" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {form.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "TR"}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-lg">{form.fullName || "Your Name"}</h3>
                <p className="text-sm text-muted-foreground">{form.currentRole || "Your Role"}{form.currentCompany ? ` at ${form.currentCompany}` : ""}</p>
                <p className="text-xs text-muted-foreground">{form.city}{form.state ? `, ${form.state}` : ""}</p>
              </div>
            </div>

            {/* Badges */}
            {previewBadges.length > 0 && <TrainerBadges badges={previewBadges} size="md" />}

            {/* Skills */}
            {(form.primarySkill || form.secondarySkill) && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {[form.primarySkill, form.secondarySkill].filter(Boolean).map(s => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Course Card */}
            {form.courseTitle && (
              <div className="border border-border rounded-xl p-4 bg-card">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Featured Course</p>
                <h4 className="font-semibold text-foreground text-sm">{form.courseTitle}</h4>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {form.courseDuration && <span>{form.courseDuration}</span>}
                  {form.courseFee && <span className="font-semibold text-foreground">₹{parseInt(form.courseFee).toLocaleString()}</span>}
                </div>
              </div>
            )}

            {/* About */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">About</p>
              <p className="text-sm text-foreground leading-relaxed">
                {form.courseDescription || "No bio added yet. Complete the Course Details step to add your description."}
              </p>
            </div>

            {/* Experience */}
            <div className="flex items-center gap-4 text-sm">
              {form.experience && (
                <div className="text-center">
                  <p className="font-bold text-foreground">{form.experience}+</p>
                  <p className="text-[10px] text-muted-foreground">Years Exp.</p>
                </div>
              )}
              <div className="text-center">
                <div className="flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                  <span className="font-bold text-foreground">New</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Rating</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">0</p>
                <p className="text-[10px] text-muted-foreground">Students</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" className="w-full" onClick={() => setShowPreview(false)}>Close Preview</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerSignup;
