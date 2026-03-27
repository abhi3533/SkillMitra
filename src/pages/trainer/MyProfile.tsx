import { useState, useEffect } from "react";
import { User, Save, Camera, Briefcase, Globe, MapPin, Phone, Mail, Linkedin, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TrainerLayout from "@/components/layouts/TrainerLayout";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { useToast } from "@/hooks/use-toast";

const TrainerMyProfile = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainer, setTrainer] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    state: "",
    bio: "",
    current_company: "",
    current_role: "",
    experience_years: "",
    linkedin_url: "",
    portfolio_url: "",
    whatsapp: "",
    skills: [] as string[],
    teaching_languages: [] as string[],
  });

  const [newSkill, setNewSkill] = useState("");
  const [newLang, setNewLang] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase.from("trainers").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      setTrainer(t);
      setProfileData(p);
      setForm({
        full_name: p?.full_name || "",
        phone: p?.phone || "",
        city: p?.city || "",
        state: p?.state || "",
        bio: t?.bio || "",
        current_company: t?.current_company || "",
        current_role: t?.current_role || "",
        experience_years: t?.experience_years?.toString() || "",
        linkedin_url: t?.linkedin_url || "",
        portfolio_url: t?.portfolio_url || "",
        whatsapp: t?.whatsapp || "",
        skills: t?.skills || [],
        teaching_languages: t?.teaching_languages || [],
      });
      setLoading(false);
    })();
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !form.skills.includes(s)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, s] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const addLang = () => {
    const l = newLang.trim();
    if (l && !form.teaching_languages.includes(l)) {
      setForm(prev => ({ ...prev, teaching_languages: [...prev.teaching_languages, l] }));
      setNewLang("");
    }
  };

  const removeLang = (lang: string) => {
    setForm(prev => ({ ...prev, teaching_languages: prev.teaching_languages.filter(l => l !== lang) }));
  };

  const handleSave = async () => {
    if (!user || !trainer) return;
    setSaving(true);
    try {
      const [profileRes, trainerRes] = await Promise.all([
        supabase.from("profiles").update({
          full_name: form.full_name,
          phone: form.phone,
          city: form.city,
          state: form.state,
        }).eq("id", user.id),
        supabase.from("trainers").update({
          bio: form.bio,
          current_company: form.current_company,
          current_role: form.current_role,
          experience_years: form.experience_years ? parseInt(form.experience_years) : null,
          linkedin_url: form.linkedin_url,
          portfolio_url: form.portfolio_url,
          whatsapp: form.whatsapp,
          skills: form.skills,
          teaching_languages: form.teaching_languages,
        }).eq("user_id", user.id),
      ]);

      if (profileRes.error || trainerRes.error) {
        throw new Error(profileRes.error?.message || trainerRes.error?.message);
      }

      toast({ title: "Profile updated", description: "Your changes have been saved successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TrainerLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
          </div>
        </div>
      </TrainerLayout>
    );
  }

  return (
    <TrainerLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">My Profile</h1>
            <p className="text-sm text-muted-foreground">Update your personal and professional details</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {isApproved && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 mb-6">
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              Some fields are verified by SkillMitra admin and cannot be changed (Name, Phone, Role, Company, Experience). To update, please contact contact@skillmitra.online
            </p>
          </div>
        )}

        {/* Profile Picture */}
        <div className="bg-card rounded-xl border p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" /> Profile Picture
          </h2>
          <ProfilePictureUpload userId={user?.id || ""} currentUrl={profileData?.profile_picture_url || null} fullName={form.full_name} onUpload={(url) => { setProfileData((p: any) => ({ ...p, profile_picture_url: url })); updateProfile({ profile_picture_url: url }); }} />
        </div>

        {/* Personal Info */}
        <div className="bg-card rounded-xl border p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name {isApproved && <Lock className="w-3 h-3 inline text-amber-500" />}</Label>
              <Input id="full_name" value={form.full_name} onChange={e => handleChange("full_name", e.target.value)} className={`mt-1.5 ${isApproved ? "bg-muted cursor-not-allowed" : ""}`} disabled={isApproved} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="mt-1.5 bg-muted" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={e => handleChange("phone", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} onChange={e => handleChange("whatsapp", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={e => handleChange("city", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" value={form.state} onChange={e => handleChange("state", e.target.value)} className="mt-1.5" />
            </div>
          </div>
        </div>

        {/* Professional Info */}
        <div className="bg-card rounded-xl border p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" /> Professional Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="current_role">Current Role</Label>
              <Input id="current_role" value={form.current_role} onChange={e => handleChange("current_role", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="current_company">Current Company</Label>
              <Input id="current_company" value={form.current_company} onChange={e => handleChange("current_company", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="experience_years">Experience (Years)</Label>
              <Input id="experience_years" type="number" value={form.experience_years} onChange={e => handleChange("experience_years", e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={form.bio} onChange={e => handleChange("bio", e.target.value)} className="mt-1.5 min-h-[100px]" placeholder="Tell students about your expertise and teaching style..." />
          </div>
        </div>

        {/* Skills */}
        <div className="bg-card rounded-xl border p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.skills.map(skill => (
              <Badge key={skill} variant="secondary" className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => removeSkill(skill)}>
                {skill} ×
              </Badge>
            ))}
            {form.skills.length === 0 && <p className="text-xs text-muted-foreground">No skills added yet</p>}
          </div>
          <div className="flex gap-2">
            <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add a skill" className="max-w-xs"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
            <Button type="button" variant="outline" size="sm" onClick={addSkill}>Add</Button>
          </div>
        </div>

        {/* Teaching Languages */}
        <div className="bg-card rounded-xl border p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Teaching Languages
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.teaching_languages.map(lang => (
              <Badge key={lang} variant="secondary" className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => removeLang(lang)}>
                {lang} ×
              </Badge>
            ))}
            {form.teaching_languages.length === 0 && <p className="text-xs text-muted-foreground">No languages added yet</p>}
          </div>
          <div className="flex gap-2">
            <Input value={newLang} onChange={e => setNewLang(e.target.value)} placeholder="Add a language" className="max-w-xs"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLang(); } }} />
            <Button type="button" variant="outline" size="sm" onClick={addLang}>Add</Button>
          </div>
        </div>

        {/* Links */}
        <div className="bg-card rounded-xl border p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Linkedin className="w-4 h-4 text-primary" /> Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input id="linkedin_url" value={form.linkedin_url} onChange={e => handleChange("linkedin_url", e.target.value)} className="mt-1.5" placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <Label htmlFor="portfolio_url">Portfolio URL</Label>
              <Input id="portfolio_url" value={form.portfolio_url} onChange={e => handleChange("portfolio_url", e.target.value)} className="mt-1.5" placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Bottom Save */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </TrainerLayout>
  );
};

export default TrainerMyProfile;
