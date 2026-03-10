import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Eye, EyeOff, ArrowRight, Check, ChevronRight, ChevronLeft, Upload, FileCheck, Loader2, CheckCircle2,
  Camera, X, Gift, Shield, Info, AlertTriangle, Star, Wifi, Mic, Volume2, MessageSquare, Clock, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanPhone, isValidPhone, isValidEmail } from "@/lib/formValidation";
import SkillMitraLogo from "@/components/SkillMitraLogo";
import TrainerBadges, { getTrainerBadges } from "@/components/TrainerBadges";
import { useAuth } from "@/hooks/useAuth";

const stateOptions = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

const expertiseOptions = [
  "Web Development", "Mobile Development", "Data Science", "Machine Learning",
  "UI/UX Design", "Digital Marketing", "Content Writing", "Graphic Design",
  "Project Management", "Cloud Computing", "DevOps", "Cybersecurity",
  "Business Analysis", "Product Management", "Sales", "HR Management", "Finance"
];

const steps = ["Personal Details", "Experience", "Course Details", "Services & Materials", "Payment & Documents", "Referral & Declaration"];
const stepHeadings = [
  "Complete your trainer profile",
  "Show us your professional journey",
  "Design your 1-on-1 course",
  "Go beyond just teaching",
  "Almost done — set up payouts",
  "Join 50+ verified trainers"
];

interface DocFile { file: File | null; name: string; }
const RequiredMark = () => <span className="text-destructive ml-0.5">*</span>;

const TrainerOnboarding = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    dob: "", gender: "", phone: "", whatsapp: "", address: "", city: "", state: "", pincode: "",
    linkedinUrl: "", portfolioUrl: "",
    experience: "", currentRole: "", currentCompany: "", primarySkill: "", secondarySkill: "", workEmail: "",
    verificationMethod: "", verificationValue: "",
    courseTitle: "", courseDuration: "", courseFee: "", courseDescription: "",
    additionalServicesDetails: "", courseMaterials: "",
    bankAccount: "", ifsc: "", accountHolderName: "", upiId: "", govtIdType: "",
    referralCode: "",
  });

  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
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
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    scheduleAutoSave();
  };
  const markTouched = (key: string) => setTouched(t => ({ ...t, [key]: true }));

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/trainer/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Load existing onboarding data
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: trainer } = await supabase
        .from("trainers")
        .select("id, onboarding_step, onboarding_data, onboarding_status, last_saved_at, dob, whatsapp, address, pincode, portfolio_url, secondary_skill, work_email, expertise_areas, verification_method, verification_value, course_title, course_duration, course_fee, course_description, additional_services_details, course_materials, bank_account_number, ifsc_code, account_holder_name, upi_id, govt_id_type, services_offered, current_role, current_company, experience_years, linkedin_url, bio, skills, selfie_url, demo_video_url, aadhaar_url, referral_code")
        .eq("user_id", user.id)
        .single();

      if (!trainer) { setInitialLoading(false); return; }

      // If already submitted, redirect to thank you
      if (trainer.onboarding_status === "pending" || trainer.onboarding_status === "approved") {
        navigate("/trainer/signup/thankyou", { replace: true });
        return;
      }

      setTrainerId(trainer.id);

      // Restore from onboarding_data JSONB if available, fallback to individual columns
      const saved = (trainer.onboarding_data && typeof trainer.onboarding_data === 'object' && Object.keys(trainer.onboarding_data as object).length > 0)
        ? trainer.onboarding_data as Record<string, any>
        : null;

      if (saved) {
        setForm(f => ({
          ...f,
          dob: saved.dob || trainer.dob || "",
          gender: saved.gender || profile?.gender || "",
          phone: saved.phone || profile?.phone || "",
          whatsapp: saved.whatsapp || trainer.whatsapp || "",
          address: saved.address || trainer.address || "",
          city: saved.city || profile?.city || "",
          state: saved.state || profile?.state || "",
          pincode: saved.pincode || trainer.pincode || "",
          linkedinUrl: saved.linkedinUrl || trainer.linkedin_url || "",
          portfolioUrl: saved.portfolioUrl || trainer.portfolio_url || "",
          experience: saved.experience || String(trainer.experience_years || ""),
          currentRole: saved.currentRole || trainer.current_role || "",
          currentCompany: saved.currentCompany || trainer.current_company || "",
          primarySkill: saved.primarySkill || (trainer.skills as string[])?.[0] || "",
          secondarySkill: saved.secondarySkill || trainer.secondary_skill || "",
          workEmail: saved.workEmail || trainer.work_email || "",
          verificationMethod: saved.verificationMethod || trainer.verification_method || "",
          verificationValue: saved.verificationValue || trainer.verification_value || "",
          courseTitle: saved.courseTitle || trainer.course_title || "",
          courseDuration: saved.courseDuration || trainer.course_duration || "",
          courseFee: saved.courseFee || String(trainer.course_fee || ""),
          courseDescription: saved.courseDescription || trainer.course_description || trainer.bio || "",
          additionalServicesDetails: saved.additionalServicesDetails || trainer.additional_services_details || "",
          courseMaterials: saved.courseMaterials || trainer.course_materials || "",
          bankAccount: saved.bankAccount || trainer.bank_account_number || "",
          ifsc: saved.ifsc || trainer.ifsc_code || "",
          accountHolderName: saved.accountHolderName || trainer.account_holder_name || "",
          upiId: saved.upiId || trainer.upi_id || "",
          govtIdType: saved.govtIdType || trainer.govt_id_type || "",
          referralCode: saved.referralCode || "",
        }));
        if (saved.expertiseAreas) setExpertiseAreas(saved.expertiseAreas);
        if (saved.servicesOffered) setServicesOffered(saved.servicesOffered);
      } else {
        // Load from profile + trainer columns
        setForm(f => ({
          ...f,
          phone: profile?.phone || "",
          city: profile?.city || "",
          state: profile?.state || "",
          gender: profile?.gender || "",
          dob: trainer.dob || "",
          whatsapp: trainer.whatsapp || "",
          address: trainer.address || "",
          pincode: trainer.pincode || "",
          linkedinUrl: trainer.linkedin_url || "",
          portfolioUrl: trainer.portfolio_url || "",
          experience: String(trainer.experience_years || ""),
          currentRole: trainer.current_role || "",
          currentCompany: trainer.current_company || "",
          primarySkill: (trainer.skills as string[])?.[0] || "",
          secondarySkill: trainer.secondary_skill || "",
          workEmail: trainer.work_email || "",
          verificationMethod: trainer.verification_method || "",
          verificationValue: trainer.verification_value || "",
          courseTitle: trainer.course_title || "",
          courseDuration: trainer.course_duration || "",
          courseFee: String(trainer.course_fee || ""),
          courseDescription: trainer.course_description || trainer.bio || "",
          additionalServicesDetails: trainer.additional_services_details || "",
          courseMaterials: trainer.course_materials || "",
          bankAccount: trainer.bank_account_number || "",
          ifsc: trainer.ifsc_code || "",
          accountHolderName: trainer.account_holder_name || "",
          upiId: trainer.upi_id || "",
          govtIdType: trainer.govt_id_type || "",
        }));
        if (trainer.expertise_areas) setExpertiseAreas(trainer.expertise_areas as string[]);
        if (trainer.services_offered) setServicesOffered(trainer.services_offered as string[]);
      }

      // Resume from saved step
      setStep(trainer.onboarding_step || 0);
      if (trainer.last_saved_at) setLastSaved(new Date(trainer.last_saved_at));
      setInitialLoading(false);
    })();
  }, [user, profile, navigate]);

  // Auto-save draft
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveDraft(false), 3000);
  }, []);

  const saveDraft = async (showToast = false) => {
    if (!trainerId || !user) return;
    setSaving(true);
    try {
      const onboardingData = {
        ...form,
        expertiseAreas,
        servicesOffered,
      };

      const { error } = await supabase.from("trainers").update({
        onboarding_step: step,
        onboarding_data: onboardingData as any,
        onboarding_status: "draft",
        last_saved_at: new Date().toISOString(),
      }).eq("id", trainerId);

      if (!error) {
        setLastSaved(new Date());
        if (showToast) {
          toast({ title: "Progress saved!", description: "Your progress has been saved. Continue anytime.", variant: "success" });
        }
      }
    } catch (err) {
      console.error("Auto-save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinueLater = async () => {
    await saveDraft(true);
    navigate("/trainer/dashboard");
  };

  const handlePhoneChange = (val: string) => {
    const cleaned = cleanPhone(val);
    update("phone", cleaned);
    if (sameAsPhone) update("whatsapp", cleaned);
  };
  const handleSameAsPhone = (checked: boolean) => {
    setSameAsPhone(checked);
    if (checked) update("whatsapp", form.phone);
  };

  const handleFileSelect = (docKey: string, file: File | null) => {
    if (file) setDocs(prev => ({ ...prev, [docKey]: { file, name: file.name } }));
  };

  const isPhoneFilled = isValidPhone(form.phone);
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

  const toggleExpertise = (e: string) => { setExpertiseAreas(p => p.includes(e) ? p.filter(x => x !== e) : [...p, e]); scheduleAutoSave(); };
  const toggleService = (s: string) => { setServicesOffered(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]); scheduleAutoSave(); };

  const validateStep = (s: number): boolean => {
    setStepAttempted(p => ({ ...p, [s]: true }));
    if (s === 0) {
      if (!form.dob) { toast({ title: "Date of birth is required", variant: "warning" }); return false; }
      if (!form.gender) { toast({ title: "Gender is required", variant: "warning" }); return false; }
      if (!isValidPhone(form.phone)) { toast({ title: "Valid 10-digit Indian mobile number required", variant: "warning" }); return false; }
      if (!selfie && !selfiePreview) { toast({ title: "Selfie upload is required for verification", variant: "warning" }); return false; }
      if (!form.city.trim()) { toast({ title: "City is required", variant: "warning" }); return false; }
      if (!form.state) { toast({ title: "State is required", variant: "warning" }); return false; }
    }
    if (s === 1) {
      if (!form.experience.trim()) { toast({ title: "Total experience is required", variant: "warning" }); return false; }
      if (!form.currentRole.trim() || !hasLetters(form.currentRole)) { toast({ title: "Valid current role is required", variant: "warning" }); return false; }
      if (!form.currentCompany.trim() || !hasLetters(form.currentCompany)) { toast({ title: "Valid company name is required", variant: "warning" }); return false; }
      if (!form.primarySkill.trim()) { toast({ title: "Primary skill is required", variant: "warning" }); return false; }
      if (expertiseAreas.length === 0) { toast({ title: "Select at least one area of expertise", variant: "warning" }); return false; }
    }
    if (s === 2) {
      if (!docs["demo_video"]?.file) { toast({ title: "Course demo video is required (5-10 min)", variant: "warning" }); return false; }
      if (!form.courseTitle.trim()) { toast({ title: "Course title is required", variant: "warning" }); return false; }
      if (!form.courseDuration.trim()) { toast({ title: "Course duration is required", variant: "warning" }); return false; }
      if (!form.courseFee.trim() || parseInt(form.courseFee) < 500) { toast({ title: "Course fee must be minimum ₹500", variant: "warning" }); return false; }
      if (!form.courseDescription.trim() || form.courseDescription.trim().length < 100) { toast({ title: "Course description must be at least 100 characters", variant: "warning" }); return false; }
    }
    if (s === 3) {
      if (servicesOffered.length === 0) { toast({ title: "Select at least one service to offer", variant: "warning" }); return false; }
    }
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

  const nextStep = async () => {
    if (validateStep(step)) {
      const newStep = step + 1;
      setStep(newStep);
      // Save draft after advancing
      if (trainerId && user) {
        const onboardingData = { ...form, expertiseAreas, servicesOffered };
        await supabase.from("trainers").update({
          onboarding_step: newStep,
          onboarding_data: onboardingData as any,
          onboarding_status: "draft",
          last_saved_at: new Date().toISOString(),
        }).eq("id", trainerId);
        setLastSaved(new Date());
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5) || !user || !trainerId) return;
    setSubmitting(true);
    try {
      // Upload files
      let profilePictureUrl: string | null = null;
      if (profilePhoto) {
        const ext = profilePhoto.name.split('.').pop();
        const photoPath = `${user.id}/profile.${ext}`;
        const { error: photoErr } = await supabase.storage.from("profile-pictures").upload(photoPath, profilePhoto, { upsert: true });
        if (!photoErr) { const { data: u } = supabase.storage.from("profile-pictures").getPublicUrl(photoPath); profilePictureUrl = u.publicUrl; }
      }

      let selfieUrl: string | null = null;
      if (selfie) {
        const ext = selfie.name.split('.').pop();
        const selfiePath = `${user.id}/selfie.${ext}`;
        const { error: sErr } = await supabase.storage.from("trainer-documents").upload(selfiePath, selfie, { upsert: true });
        if (!sErr) { selfieUrl = selfiePath; }
      }

      let demoVideoUrl: string | null = null;
      let introVideoUrl: string | null = null;
      let curriculumPdfUrl: string | null = null;
      let aadhaarUrl: string | null = null;
      const uploadedDocs: { document_type: string; document_name: string; document_url: string }[] = [];

      for (const [key, docFile] of Object.entries(docs)) {
        if (!docFile?.file) continue;
        const ext = docFile.file.name.split('.').pop();
        const bucket = key === "demo_video" || key === "intro_video" ? "intro-videos" : "trainer-documents";
        const path = `${user.id}/${key}.${ext}`;
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
          user_id: user.id,
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

      // Update onboarding status to pending
      await supabase.from("trainers").update({
        onboarding_status: "pending",
        onboarding_step: 6,
        last_saved_at: new Date().toISOString(),
      }).eq("id", trainerId);

      // Process referral
      const trimmedRef = form.referralCode.trim().toUpperCase();
      if (trimmedRef) {
        supabase.functions.invoke("process-trainer-referral", { body: { referral_code: trimmedRef, new_user_id: user.id } }).catch(console.error);
      }

      // Notifications
      supabase.functions.invoke("send-email", { body: { type: "trainer_welcome", to: profile?.email || user.email, data: { name: profile?.full_name } } }).catch(console.error);
      supabase.functions.invoke("notify-admin-new-trainer", {
        body: {
          user_id: user.id,
          trainer_name: profile?.full_name,
          email: profile?.email || user.email,
          phone: form.phone,
          city: form.city,
          skills: [form.primarySkill],
          experience_years: parseInt(form.experience) || 0,
          application_submitted: true,
        },
      }).catch(console.error);

      // Update profile with city/state if changed
      if (form.city || form.state || form.gender) {
        await supabase.from("profiles").update({
          city: form.city || undefined,
          state: form.state || undefined,
          gender: form.gender || undefined,
          phone: form.phone || undefined,
        }).eq("id", user.id);
      }

      toast({ title: "Application submitted!", description: "We'll review your profile within 24 hours.", variant: "success" });
      navigate("/trainer/signup/thankyou");
    } catch (err: any) {
      console.error("Trainer onboarding submit error:", err);
      toast({ title: "Submit failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
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

  const lastSavedText = lastSaved
    ? (() => {
        const diff = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
        if (diff < 10) return "Last saved just now";
        if (diff < 60) return `Last saved ${diff}s ago`;
        if (diff < 3600) return `Last saved ${Math.floor(diff / 60)}m ago`;
        return `Last saved ${Math.floor(diff / 3600)}h ago`;
      })()
    : null;

  if (authLoading || initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex fixed top-0 left-0 w-[40%] h-screen hero-gradient items-center justify-center p-12 overflow-hidden z-10">
        <div className="max-w-md">
          <SkillMitraLogo darkText={false} height={40} className="mb-12" />
          <h2 className="text-3xl font-bold text-primary-foreground">{stepHeadings[step]}</h2>
          <p className="mt-4 text-primary-foreground/60 leading-relaxed">Complete your profile to start teaching on SkillMitra.</p>
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{steps[step]}</h1>
              <p className="text-sm text-muted-foreground mt-1">Step {step + 1} of {steps.length}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSaveAndContinueLater} className="text-xs text-muted-foreground hover:text-foreground gap-1.5">
              <Save className="w-3.5 h-3.5" /> Save & Continue Later
            </Button>
          </div>

          {/* ========== STEP 0: Personal Details ========== */}
          {step === 0 && (
            <div className="mt-6 space-y-4">
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

              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{profile?.full_name}</span> · {profile?.email}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Date of Birth<RequiredMark /></Label>
                  <Input type="date" value={form.dob} onChange={e => update("dob", e.target.value)} onBlur={() => markTouched("dob")}
                    className={`mt-1.5 h-11 ${touched.dob ? (form.dob ? "border-green-500" : "border-destructive") : ""}`} />
                </div>
                <div>
                  <Label>Gender<RequiredMark /></Label>
                  <Select value={form.gender} onValueChange={v => { update("gender", v); markTouched("gender"); }}>
                    <SelectTrigger className={`mt-1.5 h-11 ${touched.gender ? (form.gender ? "border-green-500" : "border-destructive") : ""}`}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number<RequiredMark /></Label>
                  <Input value={form.phone} onChange={e => handlePhoneChange(e.target.value)} onBlur={() => markTouched("phone")} placeholder="9876543210" maxLength={10} inputMode="numeric"
                    className={`mt-1.5 h-11 ${touched.phone ? (isPhoneFilled ? "border-green-500" : "border-destructive") : ""}`} />
                </div>
                 <div>
                  <div className="flex items-center justify-between">
                    <Label>WhatsApp <span className="text-muted-foreground font-normal text-xs">Optional</span></Label>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <Checkbox checked={sameAsPhone} onCheckedChange={handleSameAsPhone} className="w-3.5 h-3.5" />
                      Same as phone
                    </label>
                  </div>
                  <Input value={form.whatsapp} onChange={e => { update("whatsapp", cleanPhone(e.target.value)); setSameAsPhone(false); }} placeholder="9876543210" maxLength={10} inputMode="numeric" disabled={sameAsPhone}
                    className={`mt-1.5 h-11 ${sameAsPhone ? "bg-muted" : ""}`} />
                </div>
              </div>

              <div>
                <Label>Complete Address <span className="text-muted-foreground font-normal text-xs">Optional</span></Label>
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
                  <Label>PIN Code <span className="text-muted-foreground font-normal text-xs">Optional</span></Label>
                  <Input value={form.pincode} onChange={e => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} onBlur={() => markTouched("pincode")} placeholder="6 digits" maxLength={6} inputMode="numeric" className="mt-1.5 h-11" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>LinkedIn <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input value={form.linkedinUrl} onChange={e => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/you" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label>Portfolio <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input value={form.portfolioUrl} onChange={e => update("portfolioUrl", e.target.value)} placeholder="https://yoursite.com" className="mt-1.5 h-11" />
                </div>
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
                  <Input type="number" value={form.experience} onChange={e => update("experience", e.target.value)} placeholder="e.g. 5" className="mt-1.5 h-11" min="0" />
                </div>
                <div>
                  <Label>Current Role<RequiredMark /></Label>
                  <Input value={form.currentRole} onChange={e => update("currentRole", e.target.value)} placeholder="e.g. Senior Developer" className="mt-1.5 h-11" />
                  {stepAttempted[1] && form.currentRole.trim() && !hasLetters(form.currentRole) && (
                    <p className="text-xs text-destructive mt-1">Role must contain at least one letter</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Current/Previous Company<RequiredMark /></Label>
                  <Input value={form.currentCompany} onChange={e => update("currentCompany", e.target.value)} placeholder="e.g. Google" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label>Work Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input type="email" value={form.workEmail} onChange={e => update("workEmail", e.target.value)} placeholder="you@company.com" className="mt-1.5 h-11" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Primary Skill<RequiredMark /></Label>
                  <Input value={form.primarySkill} onChange={e => update("primarySkill", e.target.value)} placeholder="e.g. React.js" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label>Secondary Skill <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input value={form.secondarySkill} onChange={e => update("secondarySkill", e.target.value)} placeholder="e.g. Node.js" className="mt-1.5 h-11" />
                </div>
              </div>

              <div>
                <Label>Areas of Expertise<RequiredMark /></Label>
                <p className="text-xs text-muted-foreground mt-0.5">Select at least one area</p>
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
                <Label className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Professional Verification <span className="text-muted-foreground font-normal text-xs">Optional</span></Label>
                <p className="text-xs text-muted-foreground">Add verification for faster approval</p>
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
                <Input value={form.courseTitle} onChange={e => update("courseTitle", e.target.value)} placeholder="e.g. Full Stack Web Development" className="mt-1.5 h-11" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Course Duration<RequiredMark /></Label>
                  <Input value={form.courseDuration} onChange={e => update("courseDuration", e.target.value)} placeholder="e.g. 3 months" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label>Course Fee (₹)<RequiredMark /></Label>
                  <Input type="number" value={form.courseFee} onChange={e => update("courseFee", e.target.value)} placeholder="Min ₹500" className="mt-1.5 h-11" min="500" />
                  {touched.courseFee && form.courseFee && parseInt(form.courseFee) < 500 && <p className="text-xs text-destructive mt-1">Minimum fee is ₹500</p>}
                </div>
              </div>
              <div>
                <Label>Course Description<RequiredMark /></Label>
                <Textarea value={form.courseDescription} onChange={e => update("courseDescription", e.target.value)} placeholder="Describe what students will learn..." className="mt-1.5 min-h-[120px]" />
                <p className="text-xs text-muted-foreground mt-1">{form.courseDescription.length}/100 characters minimum</p>
              </div>

              <Button type="button" variant="outline" className="w-full mt-4 border-primary text-primary hover:bg-primary/5" onClick={() => setShowPreview(true)}>
                <Eye className="w-4 h-4 mr-2" /> Preview Your Profile
              </Button>
            </div>
          )}

          {/* ========== STEP 3: Services & Materials ========== */}
          {step === 3 && (
            <div className="mt-6 space-y-5">
              <div>
                <Label>Additional Services You Offer<RequiredMark /></Label>
                <p className="text-xs text-muted-foreground mt-0.5">Select at least one service</p>
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
                <Textarea value={form.additionalServicesDetails} onChange={e => update("additionalServicesDetails", e.target.value)} placeholder="Describe your additional services..." className="mt-1.5 min-h-[100px]" />
              </div>
              <div>
                <Label>Course Materials & Resources <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea value={form.courseMaterials} onChange={e => update("courseMaterials", e.target.value)} placeholder="PDFs, code samples, projects..." className="mt-1.5 min-h-[100px]" />
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
                <Input value={form.bankAccount} onChange={e => update("bankAccount", e.target.value)} placeholder="Account number" className="mt-1.5 h-11" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>IFSC Code<RequiredMark /></Label>
                  <Input value={form.ifsc} onChange={e => update("ifsc", e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" className="mt-1.5 h-11 uppercase" maxLength={11} />
                  {touched.ifsc && form.ifsc && !isValidIFSC(form.ifsc) && <p className="text-xs text-destructive mt-1">Invalid IFSC format</p>}
                </div>
                <div>
                  <Label>Account Holder Name<RequiredMark /></Label>
                  <Input value={form.accountHolderName} onChange={e => update("accountHolderName", e.target.value)} placeholder="Name as per bank" className="mt-1.5 h-11" />
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
              <Button onClick={handleSubmit} disabled={submitting || !agreedTraining || !agreedTerms || !allReadinessChecked} className="gold-gradient text-accent-foreground border-0 font-semibold">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <>Submit Application <ArrowRight className="ml-2 w-4 h-4" /></>}
              </Button>
            )}
          </div>

          {/* Last saved indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {saving ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
            ) : lastSavedText ? (
              <><CheckCircle2 className="w-3 h-3 text-green-500" /> {lastSavedText}</>
            ) : null}
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Need help? <Link to="/contact" className="text-primary font-semibold hover:underline">Contact Support</Link>
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
            <div className="flex items-start gap-4">
              {profilePhotoPreview ? (
                <img src={profilePhotoPreview} alt="Profile" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {(profile?.full_name || "").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "TR"}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-lg">{profile?.full_name || "Your Name"}</h3>
                <p className="text-sm text-muted-foreground">{form.currentRole || "Your Role"}{form.currentCompany ? ` at ${form.currentCompany}` : ""}</p>
                <p className="text-xs text-muted-foreground">{form.city}{form.state ? `, ${form.state}` : ""}</p>
              </div>
            </div>
            {previewBadges.length > 0 && <TrainerBadges badges={previewBadges} size="md" />}
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
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">About</p>
              <p className="text-sm text-foreground leading-relaxed">
                {form.courseDescription || "No bio added yet."}
              </p>
            </div>
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

export default TrainerOnboarding;
