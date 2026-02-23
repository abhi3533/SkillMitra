import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Check, ChevronRight, ChevronLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const skillOptions = ["Python", "JavaScript", "React", "Node.js", "Java", "Data Science", "Machine Learning", "AWS", "Docker", "Figma", "UI/UX Design", "Digital Marketing", "SEO", "Flutter", "Cyber Security", "Product Management", "Salesforce", "Excel", "SQL", "Power BI"];
const langOptions = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Bengali", "Marathi"];
const steps = ["Personal Info", "Skills & Experience", "Documents", "Availability", "Bank Details"];

const TrainerSignup = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", city: "", gender: "", currentRole: "", currentCompany: "", experience: "", linkedinUrl: "", password: "",
    bio: "", previousCompanies: "",
    bankAccount: "", ifsc: "", upiId: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [teachLangs, setTeachLangs] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));
  const toggleSkill = (s: string) => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleLang = (l: string) => setTeachLangs(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: form.fullName, phone: form.phone, role: "trainer" },
        },
      });
      if (error) throw error;
      toast({ title: "Application submitted!", description: "We'll review your profile within 48 hours." });
      navigate("/trainer/signup/thankyou");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-5/12 hero-gradient items-center justify-center p-12">
        <div className="max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
              <span className="font-bold text-lg text-accent-foreground">S</span>
            </div>
            <span className="text-2xl font-bold text-primary-foreground">Skill<span className="text-accent">Mitra</span></span>
          </Link>
          <h2 className="text-3xl font-bold text-primary-foreground">Share your expertise. Earn from home.</h2>
          <p className="mt-4 text-primary-foreground/60 leading-relaxed">Join 850+ verified trainers earning ₹50,000 – ₹2,00,000/month teaching skills they love.</p>

          {/* Steps */}
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
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg hero-gradient flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">Skill<span className="text-accent">Mitra</span></span>
            </Link>
            {/* Mobile Steps */}
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
                <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@email.com" className="mt-1.5 h-11" /></div>
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
              {["Government ID (Aadhaar/PAN)", "Resume / CV", "Experience Certificate", "Skill Certificates", "Intro Video (2 min max)"].map(doc => (
                <div key={doc} className="border border-dashed border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG, PNG up to 10MB</p>
                    </div>
                    <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" /> Upload</Button>
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
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                  <div key={day} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                    <input type="checkbox" className="accent-primary w-4 h-4" defaultChecked={day !== "Sunday"} />
                    <span className="text-sm font-medium text-foreground w-24">{day}</span>
                    <Select defaultValue="09:00">
                      <SelectTrigger className="h-9 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">to</span>
                    <Select defaultValue="18:00">
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
              <div className="border border-dashed border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">PAN Card</p>
                    <p className="text-xs text-muted-foreground">Required for tax purposes</p>
                  </div>
                  <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" /> Upload</Button>
                </div>
              </div>
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
              <Button onClick={() => setStep(step + 1)} className="hero-gradient border-0">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || !agreed} className="gold-gradient text-accent-foreground border-0 font-semibold">
                {loading ? "Submitting..." : "Submit Application"} {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
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
