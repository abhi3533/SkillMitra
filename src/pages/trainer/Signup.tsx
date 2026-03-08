import { useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Check, ChevronRight, ChevronLeft, Upload, FileCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";
import PasswordStrengthIndicator, { isPasswordValid } from "@/components/auth/PasswordStrengthIndicator";

const skillOptions = ["Python", "JavaScript", "React", "Node.js", "Java", "Data Science", "Machine Learning", "AWS", "Docker", "Figma", "UI/UX Design", "Digital Marketing", "SEO", "Flutter", "Cyber Security", "Product Management", "Salesforce", "Excel", "SQL", "Power BI"];
const langOptions = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Bengali", "Marathi"];
const steps = ["Personal Info", "Skills & Experience", "Documents", "Availability", "Bank Details"];

interface DocFile {
  file: File | null;
  name: string;
}

interface AvailDay {
  checked: boolean;
  start: string;
  end: string;
}

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
  { key: "government_id", label: "Government ID (Aadhaar/PAN)", bucket: "trainer-documents", accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "resume", label: "Resume / CV", bucket: "trainer-documents", accept: ".pdf,.doc,.docx" },
  { key: "experience_certificate", label: "Experience Certificate", bucket: "trainer-documents", accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "skill_certificates", label: "Skill Certificates", bucket: "trainer-documents", accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "intro_video", label: "Intro Video (2 min max)", bucket: "intro-videos", accept: "video/*" },
];

const TrainerSignup = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", city: "", gender: "", currentRole: "", currentCompany: "", experience: "", linkedinUrl: "", password: "",
    bio: "", previousCompanies: "",
    bankAccount: "", ifsc: "", upiId: "", panNumber: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [teachLangs, setTeachLangs] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [docs, setDocs] = useState<Record<string, DocFile>>({});
  const [availability, setAvailability] = useState<Record<string, AvailDay>>(defaultAvail);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));
  const toggleSkill = (s: string) => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleLang = (l: string) => setTeachLangs(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l]);

  const handleFileSelect = (docKey: string, file: File | null) => {
    if (file) {
      setDocs(prev => ({ ...prev, [docKey]: { file, name: file.name } }));
    }
  };

  const updateAvail = (day: string, field: keyof AvailDay, value: any) => {
    setAvailability(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const checkDuplicateEmail = async (email: string) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setEmailError(""); return; }
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

  const validateStep = (s: number): boolean => {
    if (s === 0) {
      if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim() || !form.gender || !form.experience || !form.currentRole.trim() || !form.currentCompany.trim()) {
        toast({ title: "Please fill all required fields", variant: "destructive" });
        return false;
      }
      if (emailError) return false;
      if (!isPasswordValid(form.password)) {
        toast({ title: "Password doesn't meet all requirements", variant: "destructive" });
        return false;
      }
      if (form.password !== confirmPassword) {
        toast({ title: "Passwords do not match", variant: "destructive" });
        return false;
      }
    }
    if (s === 1) {
      if (skills.length === 0) { toast({ title: "Select at least one skill", variant: "destructive" }); return false; }
      if (teachLangs.length === 0) { toast({ title: "Select at least one language", variant: "destructive" }); return false; }
      if (!form.bio.trim()) { toast({ title: "Please add your bio", variant: "destructive" }); return false; }
    }
    if (s === 4) {
      if (!form.bankAccount.trim() || !form.ifsc.trim()) {
        toast({ title: "Bank account and IFSC are required", variant: "destructive" });
        return false;
      }
    }
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
      // 1. Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: form.fullName, phone: form.phone, role: "trainer" },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      const userId = authData.user.id;

      // 2. Update profile with extra fields
      await supabase.from("profiles").update({
        city: form.city || null,
        gender: form.gender || null,
      }).eq("id", userId);

      // 3. Update trainer record
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", userId).single();
      if (!trainer) throw new Error("Trainer profile not created");

      let introVideoUrl: string | null = null;

      // 4. Upload documents
      for (const docType of docTypes) {
        const docFile = docs[docType.key];
        if (docFile?.file) {
          const url = await uploadFile(userId, trainer.id, docType.key, docType.bucket, docFile.file);
          if (docType.key === "intro_video") {
            introVideoUrl = url;
          } else {
            await supabase.from("trainer_documents").insert({
              trainer_id: trainer.id,
              document_type: docType.key,
              document_name: docFile.name,
              document_url: url,
            });
          }
        }
      }

      // 5. Update trainer with all fields
      await supabase.from("trainers").update({
        bio: form.bio,
        skills,
        teaching_languages: teachLangs,
        experience_years: parseInt(form.experience) || 0,
        current_role: form.currentRole,
        current_company: form.currentCompany,
        linkedin_url: form.linkedinUrl || null,
        previous_companies: form.previousCompanies ? form.previousCompanies.split(",").map(c => c.trim()).filter(Boolean) : [],
        bank_account_number: form.bankAccount,
        ifsc_code: form.ifsc,
        upi_id: form.upiId || null,
        pan_number: form.panNumber || null,
        intro_video_url: introVideoUrl,
      }).eq("id", trainer.id);

      // 6. Save availability
      const dayMap: Record<string, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0 };
      const availRows = Object.entries(availability).map(([day, val]) => ({
        trainer_id: trainer.id,
        day_of_week: dayMap[day],
        start_time: val.start,
        end_time: val.end,
        is_available: val.checked,
      }));
      await supabase.from("trainer_availability").insert(availRows);

      // Process trainer referral if code provided (fire-and-forget)
      const trimmedRef = referralCode.trim().toUpperCase();
      if (trimmedRef && authData.user?.id) {
        supabase.functions.invoke("process-trainer-referral", {
          body: { referral_code: trimmedRef, new_user_id: authData.user.id },
        }).then(({ error: fnErr }) => {
          if (fnErr) console.error("Trainer referral error:", fnErr);
        });
      }

      toast({ title: "Application submitted!", description: "We'll review your profile within 48 hours." });
      navigate("/trainer/signup/thankyou");
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
            <img src="/skillmitra-logo.png" alt="SkillMitra" className="h-9 w-auto block brightness-0 invert" style={{ background: 'transparent' }} />
          </Link>
          <h2 className="text-3xl font-bold text-primary-foreground">Share your expertise. Earn from home.</h2>
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
      <div className="flex-1 flex items-start justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg py-8">
          <div className="lg:hidden mb-6">
            <Link to="/" className="flex items-center">
              <img src="/skillmitra-logo.png" alt="SkillMitra" className="h-10" />
            </Link>
            <div className="flex items-center gap-1 mt-4">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "hero-gradient" : "bg-secondary"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Step {step + 1} of {steps.length}: {steps[step]}</p>
          </div>

          <h1 className="text-2xl font-bold text-foreground">{steps[step]}</h1>

          {/* Step 0: Personal Info */}
          {step === 0 && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Full Name *</Label><Input value={form.fullName} onChange={e => update("fullName", e.target.value)} placeholder="Your full name" className="mt-1.5 h-11" /></div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} onBlur={() => checkDuplicateEmail(form.email)} placeholder="you@email.com" className={`mt-1.5 h-11 ${emailError ? "border-destructive" : ""}`} />
                  {emailError && (
                    <p className="text-xs text-destructive mt-1">
                      {emailError}{" "}
                      {emailError.includes("student login") && <Link to="/student/login" className="font-semibold underline">Student Login</Link>}
                      {emailError.includes("login instead") && <Link to="/trainer/login" className="font-semibold underline">Login here</Link>}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Phone *</Label><Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+91 98765 43210" className="mt-1.5 h-11" /></div>
                <div><Label>City *</Label><Input value={form.city} onChange={e => update("city", e.target.value)} placeholder="Your city" className="mt-1.5 h-11" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Gender *</Label>
                  <Select value={form.gender} onValueChange={v => update("gender", v)}>
                    <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Years of Experience *</Label><Input type="number" value={form.experience} onChange={e => update("experience", e.target.value)} placeholder="e.g. 5" className="mt-1.5 h-11" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Current Role *</Label><Input value={form.currentRole} onChange={e => update("currentRole", e.target.value)} placeholder="e.g. Senior Developer" className="mt-1.5 h-11" /></div>
                <div><Label>Current Company *</Label><Input value={form.currentCompany} onChange={e => update("currentCompany", e.target.value)} placeholder="e.g. Google" className="mt-1.5 h-11" /></div>
              </div>
              <div><Label>LinkedIn Profile URL</Label><Input value={form.linkedinUrl} onChange={e => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/yourprofile" className="mt-1.5 h-11" /></div>
              <div>
                <Label>Password *</Label>
                <div className="relative mt-1.5">
                  <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)} placeholder="Min 8 characters" className="h-11 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={form.password} confirmPassword={confirmPassword} showConfirm />
              </div>
              <div>
                <Label>Confirm Password *</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="mt-1.5 h-11" />
              </div>
              <div>
                <Label>Referral Code <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TM-A1B2C3"
                  className="mt-1.5 h-11 font-mono uppercase"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground mt-1">Got a code from another trainer? Enter it here.</p>
              </div>
            </div>
          )}

          {/* Step 1: Skills */}
          {step === 1 && (
            <div className="mt-6 space-y-5">
              <div>
                <Label>Skills You Can Teach *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skillOptions.map(s => (
                    <button key={s} type="button" onClick={() => toggleSkill(s)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${skills.includes(s) ? "hero-gradient text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Teaching Languages *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {langOptions.map(l => (
                    <button key={l} type="button" onClick={() => toggleLang(l)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${teachLangs.includes(l) ? "gold-gradient text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Bio (150 words max) *</Label>
                <Textarea value={form.bio} onChange={e => update("bio", e.target.value)} placeholder="Tell students about your teaching experience and approach..." className="mt-1.5 min-h-[120px]" maxLength={900} />
              </div>
              <div>
                <Label>Previous Companies</Label>
                <Input value={form.previousCompanies} onChange={e => update("previousCompanies", e.target.value)} placeholder="e.g. Amazon, TCS, Infosys (comma separated)" className="mt-1.5 h-11" />
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <div className="mt-6 space-y-5">
              <p className="text-sm text-muted-foreground">Upload documents for verification. All documents are securely stored and only visible to our verification team.</p>
              {docTypes.map(doc => (
                <div key={doc.key} className="border border-dashed border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.label}</p>
                      {docs[doc.key] ? (
                        <p className="text-xs text-success mt-0.5 flex items-center gap-1"><FileCheck className="w-3 h-3" />{docs[doc.key].name}</p>
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
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Availability */}
          {step === 3 && (
            <div className="mt-6 space-y-5">
              <p className="text-sm text-muted-foreground">Select your weekly available time slots. Students will book sessions based on this schedule.</p>
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

          {/* Step 4: Bank Details */}
          {step === 4 && (
            <div className="mt-6 space-y-5">
              <p className="text-sm text-muted-foreground">Add your bank details for receiving payouts. This information is encrypted and secure.</p>
              <div><Label>Bank Account Number *</Label><Input value={form.bankAccount} onChange={e => update("bankAccount", e.target.value)} placeholder="Account number" className="mt-1.5 h-11" /></div>
              <div><Label>IFSC Code *</Label><Input value={form.ifsc} onChange={e => update("ifsc", e.target.value)} placeholder="e.g. SBIN0001234" className="mt-1.5 h-11" /></div>
              <div><Label>UPI ID</Label><Input value={form.upiId} onChange={e => update("upiId", e.target.value)} placeholder="e.g. yourname@upi" className="mt-1.5 h-11" /></div>
              <div><Label>PAN Number</Label><Input value={form.panNumber} onChange={e => update("panNumber", e.target.value)} placeholder="e.g. ABCDE1234F" className="mt-1.5 h-11" /></div>
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
