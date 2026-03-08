import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import StudentLayout from "@/components/layouts/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X } from "lucide-react";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";

const courseInterestOptions = ["Python", "JavaScript", "React", "Node.js", "Java", "Data Science", "Machine Learning", "AWS", "Docker", "Figma", "UI/UX Design", "Digital Marketing", "SEO", "Flutter", "Cyber Security", "Product Management", "Salesforce", "Excel", "SQL", "Power BI"];
const languageOptions = ["Telugu", "Hindi", "Tamil", "English", "Kannada", "Malayalam", "Bengali", "Marathi"];
const stateOptions = ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Maharashtra", "Delhi", "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal", "Kerala"];

const StudentProfile = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courseInterests, setCourseInterests] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [gender, setGender] = useState("");
  const [trainerPref, setTrainerPref] = useState("no_preference");

  useEffect(() => {
    if (!user?.id) return;
    // Load student data
    supabase.from('students').select('course_interests, trainer_gender_preference').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setCourseInterests((data.course_interests as string[]) || []);
          setTrainerPref(data.trainer_gender_preference || "no_preference");
        }
      });
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      setLanguages(profile.language_preference || []);
      setCity(profile.city || "");
      setState(profile.state || "");
      setGender(profile.gender || "");
    }
  }, [profile]);

  const toggleInterest = (interest: string) => {
    setCourseInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const toggleLang = (lang: string) => {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const [profileRes, studentRes] = await Promise.all([
        supabase.from('profiles').update({
          city: city || null,
          state: state || null,
          gender: gender || null,
          language_preference: languages,
        }).eq('id', user.id),
        supabase.from('students').update({
          course_interests: courseInterests,
          trainer_gender_preference: trainerPref,
        }).eq('user_id', user.id),
      ]);
      if (profileRes.error) throw profileRes.error;
      if (studentRes.error) throw studentRes.error;
      toast({ title: "Profile updated!" });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudentLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4 mr-1" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="w-4 h-4 mr-1" /> Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border p-6 space-y-6">
        {/* Basic Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-2xl">{profile?.full_name?.[0] || "U"}</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{profile?.full_name || "User"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground ml-2">{profile?.phone || "-"}</span></div>
          {editing ? (
            <>
              <div>
                <Label className="text-muted-foreground">City</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stateOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div><span className="text-muted-foreground">City:</span> <span className="text-foreground ml-2">{city || "-"}</span></div>
              <div><span className="text-muted-foreground">State:</span> <span className="text-foreground ml-2">{state || "-"}</span></div>
              <div><span className="text-muted-foreground">Gender:</span> <span className="text-foreground ml-2">{gender || "-"}</span></div>
            </>
          )}
        </div>

        {/* Trainer Gender Preference */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Trainer Gender Preference</Label>
          {editing ? (
            <Select value={trainerPref} onValueChange={setTrainerPref}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male Trainer</SelectItem>
                <SelectItem value="female">Female Trainer</SelectItem>
                <SelectItem value="no_preference">No Preference</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-foreground mt-1 capitalize">{trainerPref === "no_preference" ? "No Preference" : `${trainerPref} Trainer`}</p>
          )}
        </div>

        {/* Languages */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Preferred Learning Languages</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {editing ? languageOptions.map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLang(lang)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  languages.includes(lang)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {lang}
              </button>
            )) : (
              languages.length > 0
                ? languages.map(l => <span key={l} className="px-3 py-1.5 rounded-full text-sm bg-secondary text-secondary-foreground">{l}</span>)
                : <p className="text-sm text-muted-foreground">None selected</p>
            )}
          </div>
        </div>

        {/* Course Interests */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Courses Interested In</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {editing ? courseInterestOptions.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  courseInterests.includes(interest)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {interest}
              </button>
            )) : (
              courseInterests.length > 0
                ? courseInterests.map(i => <span key={i} className="px-3 py-1.5 rounded-full text-sm bg-accent text-accent-foreground">{i}</span>)
                : <p className="text-sm text-muted-foreground">None selected — edit your profile to add interests for better trainer matching!</p>
            )}
          </div>
          {editing && <p className="text-xs text-muted-foreground mt-1">Select skills you want to learn — helps us match you with the right trainers</p>}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;
