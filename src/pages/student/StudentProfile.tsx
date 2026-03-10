import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import StudentLayout from "@/components/layouts/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X, Plus, Trash2, ExternalLink } from "lucide-react";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";

const courseInterestOptions = ["Python", "JavaScript", "React", "Node.js", "Java", "Data Science", "Machine Learning", "AWS", "Docker", "Figma", "UI/UX Design", "Digital Marketing", "SEO", "Flutter", "Cyber Security", "Product Management", "Salesforce", "Excel", "SQL", "Power BI"];
const languageOptions = ["Telugu", "Hindi", "Tamil", "English", "Kannada", "Malayalam", "Bengali", "Marathi"];
const stateOptions = ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Maharashtra", "Delhi", "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal", "Kerala"];

const popularSkills = ["Python", "JavaScript", "React", "Node.js", "Data Science", "UI/UX", "Digital Marketing", "Excel", "Communication", "Leadership"];

interface Project {
  name: string;
  description: string;
  link?: string;
  tech_stack?: string;
}

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
  const [fullName, setFullName] = useState("");
  const [trainerPref, setTrainerPref] = useState("no_preference");

  // Skills state
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [tempSkills, setTempSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [savingSkills, setSavingSkills] = useState(false);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProjectIdx, setEditingProjectIdx] = useState<number | null>(null);
  const [projectForm, setProjectForm] = useState<Project>({ name: "", description: "", link: "", tech_stack: "" });
  const [savingProject, setSavingProject] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('students').select('id, course_interests, trainer_gender_preference, skills_learning').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setStudentId(data.id);
          setCourseInterests((data.course_interests as string[]) || []);
          setTrainerPref(data.trainer_gender_preference || "no_preference");
          setSkills((data.skills_learning as string[]) || []);
        }
      });

    // Load projects from student_resumes
    supabase.from('student_resumes').select('projects').eq('student_id', user.id).single()
      .then(({ data }) => {
        // student_resumes uses student_id which references students.id, need to find by student id
      });
  }, [user?.id]);

  // Load projects after we have studentId
  useEffect(() => {
    if (!studentId) return;
    supabase.from('student_resumes').select('projects').eq('student_id', studentId).single()
      .then(({ data }) => {
        if (data?.projects) {
          setProjects(data.projects as unknown as Project[]);
        }
      });
  }, [studentId]);

  useEffect(() => {
    if (profile) {
      setLanguages(profile.language_preference || []);
      setCity(profile.city || "");
      setState(profile.state || "");
      setGender(profile.gender || "");
      setFullName(profile.full_name || "");
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
      toast({ title: "Profile updated!", variant: "success" });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Skills modal handlers
  const openSkillsModal = () => {
    setTempSkills([...skills]);
    setCustomSkill("");
    setSkillsModalOpen(true);
  };

  const toggleTempSkill = (skill: string) => {
    setTempSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !tempSkills.includes(trimmed)) {
      setTempSkills(prev => [...prev, trimmed]);
      setCustomSkill("");
    }
  };

  const saveSkills = async () => {
    if (!user?.id) return;
    setSavingSkills(true);
    try {
      const { error } = await supabase.from('students').update({ skills_learning: tempSkills }).eq('user_id', user.id);
      if (error) throw error;
      setSkills(tempSkills);
      setSkillsModalOpen(false);
      toast({ title: "Skills updated!", variant: "success" });
    } catch (err: any) {
      toast({ title: "Failed to save skills", description: err.message, variant: "destructive" });
    } finally {
      setSavingSkills(false);
    }
  };

  const removeSkill = async (skill: string) => {
    if (!user?.id) return;
    const updated = skills.filter(s => s !== skill);
    const { error } = await supabase.from('students').update({ skills_learning: updated }).eq('user_id', user.id);
    if (!error) {
      setSkills(updated);
      toast({ title: "Skill removed", variant: "success" });
    }
  };

  // Project modal handlers
  const openAddProject = () => {
    setEditingProjectIdx(null);
    setProjectForm({ name: "", description: "", link: "", tech_stack: "" });
    setProjectModalOpen(true);
  };

  const openEditProject = (idx: number) => {
    setEditingProjectIdx(idx);
    setProjectForm({ ...projects[idx] });
    setProjectModalOpen(true);
  };

  const saveProject = async () => {
    if (!projectForm.name.trim() || !projectForm.description.trim()) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    if (!studentId) return;
    setSavingProject(true);
    try {
      let updatedProjects: Project[];
      if (editingProjectIdx !== null) {
        updatedProjects = projects.map((p, i) => i === editingProjectIdx ? { ...projectForm } : p);
      } else {
        updatedProjects = [...projects, { ...projectForm }];
      }

      // Upsert into student_resumes
      const { error } = await supabase.from('student_resumes').upsert({
        student_id: studentId,
        projects: updatedProjects as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' });

      if (error) throw error;
      setProjects(updatedProjects);
      setProjectModalOpen(false);
      toast({ title: editingProjectIdx !== null ? "Project updated!" : "Project added!", variant: "success" });
    } catch (err: any) {
      toast({ title: "Failed to save project", description: err.message, variant: "destructive" });
    } finally {
      setSavingProject(false);
    }
  };

  const deleteProject = async (idx: number) => {
    if (!studentId) return;
    const updatedProjects = projects.filter((_, i) => i !== idx);
    const { error } = await supabase.from('student_resumes').update({
      projects: updatedProjects as any,
      updated_at: new Date().toISOString(),
    }).eq('student_id', studentId);

    if (!error) {
      setProjects(updatedProjects);
      toast({ title: "Project deleted", variant: "success" });
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
          <ProfilePictureUpload
            userId={user?.id || ""}
            currentUrl={profile?.profile_picture_url}
            fullName={profile?.full_name || "User"}
            size="lg"
          />
          <div>
            <p className="text-lg font-semibold text-foreground">{profile?.full_name || "User"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>

        {/* Editable Full Name */}
        {editing && (
          <div>
            <Label className="text-muted-foreground">Full Name</Label>
            <Input
              value={fullName}
              onChange={e => {
                const val = e.target.value;
                if (/^[a-zA-Z\s.'\-]*$/.test(val)) setFullName(val);
              }}
              className="mt-1"
              placeholder="Your full name"
            />
            {fullName.trim() && !/^[a-zA-Z\s.'\-]+$/.test(fullName.trim()) && (
              <p className="text-xs text-destructive mt-1">Name must contain only letters</p>
            )}
          </div>
        )}

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

        {/* Skills Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium text-muted-foreground">My Skills</Label>
            <Button variant="outline" size="sm" onClick={openSkillsModal}>
              <Plus className="w-4 h-4 mr-1" /> Add Skills
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.length > 0 ? skills.map(skill => (
              <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-primary/10 text-primary font-medium">
                {skill}
                <button onClick={() => removeSkill(skill)} className="hover:text-destructive transition-colors" aria-label={`Remove ${skill}`}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )) : (
              <p className="text-sm text-muted-foreground">No skills added yet — click "Add Skills" to showcase your abilities!</p>
            )}
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium text-muted-foreground">My Projects</Label>
            <Button variant="outline" size="sm" onClick={openAddProject}>
              <Plus className="w-4 h-4 mr-1" /> Add Project
            </Button>
          </div>
          {projects.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {projects.map((project, idx) => (
                <div key={idx} className="bg-muted/50 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-foreground text-sm">{project.name}</h4>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEditProject(idx)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" aria-label="Edit project">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteProject(idx)} className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" aria-label="Delete project">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                  {project.tech_stack && <p className="text-xs text-primary mt-1.5">{project.tech_stack}</p>}
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5">
                      <ExternalLink className="w-3 h-3" /> View Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No projects added yet — click "Add Project" to highlight your work!</p>
          )}
        </div>
      </div>

      {/* Skills Modal */}
      <Dialog open={skillsModalOpen} onOpenChange={setSkillsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Skills</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Popular Skills</Label>
              <div className="flex flex-wrap gap-2">
                {popularSkills.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleTempSkill(skill)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      tempSkills.includes(skill)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">Add Custom Skill</Label>
              <div className="flex gap-2">
                <Input
                  value={customSkill}
                  onChange={e => setCustomSkill(e.target.value)}
                  placeholder="Type a skill..."
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomSkill(); } }}
                />
                <Button variant="outline" size="sm" onClick={addCustomSkill} disabled={!customSkill.trim()}>Add</Button>
              </div>
            </div>
            {tempSkills.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Selected Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {tempSkills.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-primary/10 text-primary font-medium">
                      {skill}
                      <button onClick={() => toggleTempSkill(skill)} aria-label={`Remove ${skill}`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSkillsModalOpen(false)}>Cancel</Button>
            <Button onClick={saveSkills} disabled={savingSkills}>
              {savingSkills ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Modal */}
      <Dialog open={projectModalOpen} onOpenChange={setProjectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProjectIdx !== null ? "Edit Project" : "Add Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Project Name <span className="text-destructive">*</span></Label>
              <Input
                value={projectForm.name}
                onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))}
                placeholder="My Awesome Project"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Description <span className="text-destructive">*</span></Label>
              <Textarea
                value={projectForm.description}
                onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Briefly describe what this project does..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-sm">Project Link <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                value={projectForm.link || ""}
                onChange={e => setProjectForm(p => ({ ...p, link: e.target.value }))}
                placeholder="https://github.com/..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Tech Stack <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                value={projectForm.tech_stack || ""}
                onChange={e => setProjectForm(p => ({ ...p, tech_stack: e.target.value }))}
                placeholder="React, Node.js, PostgreSQL"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setProjectModalOpen(false)}>Cancel</Button>
            <Button onClick={saveProject} disabled={savingProject}>
              {savingProject ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
};

export default StudentProfile;
