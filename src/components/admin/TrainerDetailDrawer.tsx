import { useState, useEffect, useRef } from "react";
import { formatLongDateIST, formatDateIST } from "@/lib/dateUtils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, FileText, User, Briefcase, MapPin, Phone, Mail, Calendar, Shield, Download, Gift, Clock, Pencil, ShieldOff, Trash2, BookOpen, IndianRupee, Send, Loader2, Eye, EyeOff, Upload, Save, RotateCcw, MessageSquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrainerDetailDrawerProps {
  trainer: any;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSuspend?: (trainer: any) => void;
  onRemove?: (trainer: any) => void;
  onEdit?: (trainer: any) => void;
}

const resolveStorageUrl = async (
  pathOrUrl: string,
  bucket = "trainer-documents",
  expiresIn = 3600,
): Promise<string> => {
  if (pathOrUrl.startsWith("http")) {
    const privateBucketMatch = pathOrUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/trainer-documents\/(.+?)(\?.*)?$/);
    if (privateBucketMatch) {
      const extractedPath = decodeURIComponent(privateBucketMatch[1]);
      const { data, error } = await supabase.storage
        .from("trainer-documents")
        .createSignedUrl(extractedPath, expiresIn);
      if (!error && data?.signedUrl) return data.signedUrl;
    }
    return pathOrUrl;
  }
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(pathOrUrl, expiresIn);
  if (error || !data?.signedUrl) {
    console.error("Signed URL error:", error);
    return "";
  }
  return data.signedUrl;
};

const NP = "Not provided";

const TrainerDetailDrawer = ({ trainer, open, onClose, onApprove, onReject, onSuspend, onRemove, onEdit }: TrainerDetailDrawerProps) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [referralInfo, setReferralInfo] = useState<{ referrerName: string; code: string } | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("Message from SkillMitra Admin");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [hidePhoto, setHidePhoto] = useState(false);
  const [togglingPhoto, setTogglingPhoto] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [requestingField, setRequestingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadField, setPendingUploadField] = useState<string | null>(null);

  const resolveUrls = async (t: any) => {
    const urls: Record<string, string> = {};
    if (t.aadhaar_url) {
      urls.aadhaar = await resolveStorageUrl(t.aadhaar_url);
    }
    setSignedUrls(urls);
  };

  const initEditForm = (t: any) => {
    const p = t.profiles || {};
    setEditForm({
      full_name: p.full_name || "",
      phone: p.phone || "",
      email: p.email || "",
      city: p.city || "",
      state: p.state || "",
      gender: p.gender || "",
      bio: t.bio || "",
      experience_years: t.experience_years?.toString() || "",
      current_role: t.current_role || "",
      current_company: t.current_company || "",
      linkedin_url: t.linkedin_url || "",
      address: t.address || "",
      whatsapp: t.whatsapp || "",
      dob: t.dob || "",
      account_holder_name: t.account_holder_name || "",
      bank_account_number: t.bank_account_number || "",
      ifsc_code: t.ifsc_code || "",
      upi_id: t.upi_id || "",
      skills: (t.skills || []).join(", "),
      expertise_areas: (t.expertise_areas || []).join(", "),
      teaching_languages: (t.teaching_languages || []).join(", "),
    });
  };

  useEffect(() => {
    if (!trainer || !open) return;
    setSignedUrls({});
    setDocuments([]);
    setReferralInfo(null);
    setCourses([]);
    setHidePhoto(trainer.hide_photo || false);
    setEditMode(false);
    initEditForm(trainer);
    resolveUrls(trainer);

    (async () => {
      setLoadingCourses(true);
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("trainer_id", trainer.id)
        .order("created_at", { ascending: false });
      setCourses(data || []);
      setLoadingCourses(false);
    })();

    (async () => {
      setLoadingDocs(true);
      const { data } = await supabase
        .from("trainer_documents")
        .select("*")
        .eq("trainer_id", trainer.id)
        .order("uploaded_at", { ascending: false });

      const docsWithUrls = await Promise.all(
        (data || []).map(async (doc: any) => {
          if (doc.document_url && !doc.document_url.startsWith("http")) {
            const signedUrl = await resolveStorageUrl(doc.document_url);
            return { ...doc, resolved_url: signedUrl };
          }
          return { ...doc, resolved_url: doc.document_url };
        })
      );

      setDocuments(docsWithUrls);
      setLoadingDocs(false);
    })();

    (async () => {
      const { data: refData } = await supabase
        .from("trainer_referrals")
        .select("referral_code, referrer_id")
        .eq("referred_id", trainer.id)
        .limit(1)
        .maybeSingle();

      if (refData) {
        const { data: referrerTrainer } = await supabase
          .from("trainers")
          .select("user_id")
          .eq("id", refData.referrer_id)
          .single();

        let referrerName = "Unknown";
        if (referrerTrainer?.user_id) {
          const { data: referrerProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", referrerTrainer.user_id)
            .single();
          referrerName = referrerProfile?.full_name || "Unknown";
        }

        setReferralInfo({
          referrerName,
          code: refData.referral_code || trainer.referred_by || "—",
        });
      } else if (trainer.referred_by) {
        setReferralInfo({
          referrerName: "—",
          code: trainer.referred_by,
        });
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainer?.id, open]);

  if (!trainer) return null;

  const handleTogglePhoto = async (checked: boolean) => {
    setTogglingPhoto(true);
    const newVal = !checked;
    const { error } = await supabase.from("trainers").update({ hide_photo: newVal }).eq("id", trainer.id);
    if (error) {
      toast.error("Failed to update photo visibility");
    } else {
      setHidePhoto(newVal);
      toast.success(newVal ? "Photo hidden from website" : "Photo visible on website");
    }
    setTogglingPhoto(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const profileUpdate: Record<string, any> = {
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || null,
        city: editForm.city.trim() || null,
        state: editForm.state.trim() || null,
        gender: editForm.gender.trim() || null,
      };

      const trainerUpdate: Record<string, any> = {
        bio: editForm.bio.trim(),
        experience_years: editForm.experience_years ? parseInt(editForm.experience_years) : null,
        "current_role": editForm.current_role.trim(),
        current_company: editForm.current_company.trim(),
        linkedin_url: editForm.linkedin_url.trim() || null,
        address: editForm.address.trim() || null,
        whatsapp: editForm.whatsapp.trim() || null,
        dob: editForm.dob.trim() || null,
        account_holder_name: editForm.account_holder_name.trim() || null,
        bank_account_number: editForm.bank_account_number.trim() || null,
        ifsc_code: editForm.ifsc_code.trim() || null,
        upi_id: editForm.upi_id.trim() || null,
        skills: editForm.skills.split(",").map(s => s.trim()).filter(Boolean),
        expertise_areas: editForm.expertise_areas.split(",").map(s => s.trim()).filter(Boolean),
        teaching_languages: editForm.teaching_languages.split(",").map(s => s.trim()).filter(Boolean),
      };

      const [profileRes, trainerRes] = await Promise.all([
        supabase.from("profiles").update(profileUpdate).eq("id", trainer.user_id),
        supabase.from("trainers").update(trainerUpdate).eq("id", trainer.id),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (trainerRes.error) throw trainerRes.error;

      toast.success("All changes saved successfully");
      setEditMode(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (field: string, file: File) => {
    setUploadingField(field);
    try {
      const ext = file.name.split(".").pop();
      const timestamp = Date.now();

      if (field === "profile_photo") {
        const path = `${trainer.user_id}/${timestamp}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("profile-pictures").upload(path, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: pubUrl } = supabase.storage.from("profile-pictures").getPublicUrl(path);
        await supabase.from("profiles").update({ profile_picture_url: pubUrl.publicUrl }).eq("id", trainer.user_id);
        toast.success("Profile photo updated");
      } else if (field === "aadhaar") {
        const path = `${trainer.user_id}/aadhaar_${timestamp}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("trainer-documents").upload(path, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        await supabase.from("trainers").update({ aadhaar_url: path }).eq("id", trainer.id);
        toast.success("Aadhaar/ID updated");
      } else if (field === "resume") {
        const path = `${trainer.user_id}/resume_${timestamp}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("trainer-documents").upload(path, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        const existingResume = documents.find(d => d.document_type === "resume");
        if (existingResume) {
          await supabase.from("trainer_documents").update({ document_url: path, document_name: file.name }).eq("id", existingResume.id);
        } else {
          await supabase.from("trainer_documents").insert({ trainer_id: trainer.id, document_type: "resume", document_url: path, document_name: file.name });
        }
        toast.success("Resume updated");
      } else if (field === "intro_video") {
        const path = `${trainer.user_id}/${timestamp}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("intro-videos").upload(path, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: pubUrl } = supabase.storage.from("intro-videos").getPublicUrl(path);
        await supabase.from("trainers").update({ intro_video_url: pubUrl.publicUrl }).eq("id", trainer.id);
        toast.success("Intro video updated");
      } else if (field === "demo_video") {
        const path = `${trainer.user_id}/demo_${timestamp}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("intro-videos").upload(path, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: pubUrl } = supabase.storage.from("intro-videos").getPublicUrl(path);
        await supabase.from("trainers").update({ demo_video_url: pubUrl.publicUrl }).eq("id", trainer.id);
        toast.success("Demo video updated");
      } else if (field === "curriculum_pdf") {
        const path = `${trainer.user_id}/curriculum_${timestamp}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("course-materials").upload(path, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: pubUrl } = supabase.storage.from("course-materials").getPublicUrl(path);
        await supabase.from("trainers").update({ curriculum_pdf_url: pubUrl.publicUrl }).eq("id", trainer.id);
        toast.success("Curriculum PDF updated");
      } else if (field === "selfie") {
        const path = `${trainer.user_id}/selfie_${timestamp}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("trainer-documents").upload(path, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        await supabase.from("trainers").update({ verification_selfie_url: path }).eq("id", trainer.id);
        toast.success("Verification selfie updated");
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingField(null);
    }
  };

  const handleRequestUpdate = async (fieldLabel: string) => {
    setRequestingField(fieldLabel);
    try {
      const { error } = await supabase.functions.invoke("request-profile-update", {
        body: { field: fieldLabel, reason: `Admin has requested you to update your "${fieldLabel}" on your profile.` },
      });
      if (error) throw error;
      toast.success(`Update request sent for "${fieldLabel}"`);
    } catch (err: any) {
      // Send email directly as fallback
      try {
        const profile = trainer.profiles;
        await supabase.functions.invoke("send-email", {
          body: {
            to: profile?.email,
            subject: `SkillMitra: Please update your ${fieldLabel}`,
            html: `<p>Hi ${profile?.full_name || "Trainer"},</p><p>Our admin team has reviewed your profile and would like you to update your <strong>${fieldLabel}</strong>.</p><p>Please log in to your SkillMitra account and update this information at your earliest convenience.</p><p>Best regards,<br/>SkillMitra Admin Team</p>`,
          },
        });
        toast.success(`Update request email sent for "${fieldLabel}"`);
      } catch (e2: any) {
        toast.error("Failed to send update request");
      }
    } finally {
      setRequestingField(null);
    }
  };

  const profile = trainer.profiles;
  const isPending = trainer.approval_status === "pending";

  const EditableField = ({ icon: Icon, label, fieldKey, type = "text", multiline = false }: { icon: any; label: string; fieldKey: string; type?: string; multiline?: boolean }) => {
    const value = editForm[fieldKey] ?? "";
    const display = value || NP;

    if (!editMode) {
      return (
        <div className="flex items-start gap-2.5 py-1.5 group">
          <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className={`text-sm break-words ${display === NP ? "text-muted-foreground italic" : "text-foreground"}`}>{display}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-2.5 py-1.5">
        <Icon className="w-4 h-4 text-muted-foreground mt-2 shrink-0" />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-primary gap-0.5"
              disabled={requestingField === label}
              onClick={() => handleRequestUpdate(label)}
            >
              {requestingField === label ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
              Request
            </Button>
          </div>
          {multiline ? (
            <Textarea
              value={value}
              onChange={e => setEditForm(f => ({ ...f, [fieldKey]: e.target.value }))}
              className="text-sm min-h-[60px]"
              rows={3}
            />
          ) : (
            <Input
              type={type}
              value={value}
              onChange={e => setEditForm(f => ({ ...f, [fieldKey]: e.target.value }))}
              className="text-sm h-8"
            />
          )}
        </div>
      </div>
    );
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number | null | undefined }) => {
    const display = value ? String(value) : NP;
    return (
      <div className="flex items-start gap-2.5 py-1.5">
        <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className={`text-sm break-words ${display === NP ? "text-muted-foreground italic" : "text-foreground"}`}>{display}</p>
        </div>
      </div>
    );
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h4 className="text-sm font-semibold text-foreground mb-2">{children}</h4>
  );

  const FileUploadButton = ({ field, label, accept }: { field: string; label: string; accept: string }) => {
    if (!editMode) return null;
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-[11px] gap-1 mt-1"
        disabled={uploadingField === field}
        onClick={() => {
          setPendingUploadField(field);
          const input = document.createElement("input");
          input.type = "file";
          input.accept = accept;
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFileUpload(field, file);
          };
          input.click();
        }}
      >
        {uploadingField === field ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        {uploadingField === field ? "Uploading..." : `Upload / Replace ${label}`}
      </Button>
    );
  };

  const resumeDoc = documents.find(d => d.document_type === "resume");

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Trainer Application — Full Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Edit Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => {
                if (editMode) {
                  initEditForm(trainer);
                }
                setEditMode(!editMode);
              }}
            >
              {editMode ? <RotateCcw className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
              {editMode ? "Cancel Edit" : "Edit All Fields"}
            </Button>
            {editMode && (
              <Button size="sm" className="gap-1.5 text-xs" onClick={handleSaveAll} disabled={saving}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? "Saving..." : "Save All Changes"}
              </Button>
            )}
          </div>

          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border-2 border-border">
              {profile?.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt="" className="w-16 h-16 rounded-full object-cover" loading="lazy" />
              ) : (
                <span className="text-primary font-bold text-xl">{profile?.full_name?.[0] || "T"}</span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-foreground">{profile?.full_name || "Unknown"}</h3>
              <p className="text-sm text-muted-foreground">{trainer.current_role || "Trainer"}{trainer.current_company ? ` at ${trainer.current_company}` : ""}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={trainer.approval_status === "approved" ? "default" : trainer.approval_status === "rejected" ? "destructive" : "secondary"} className="text-[11px]">
                  {trainer.approval_status}
                </Badge>
                <Badge variant="outline" className="text-[11px]">
                  {trainer.trainer_status || "inactive"}
                </Badge>
              </div>
            </div>
          </div>

          {/* ─── PERSONAL DETAILS ─── */}
          <Separator />
          <div>
            <SectionTitle>Personal Details</SectionTitle>
            <EditableField icon={User} label="Full Name" fieldKey="full_name" />
            <EditableField icon={Mail} label="Email" fieldKey="email" type="email" />
            <EditableField icon={Phone} label="Phone" fieldKey="phone" />
            <EditableField icon={Phone} label="WhatsApp" fieldKey="whatsapp" />
            <EditableField icon={Calendar} label="Date of Birth" fieldKey="dob" />
            <EditableField icon={User} label="Gender" fieldKey="gender" />
            <EditableField icon={MapPin} label="City" fieldKey="city" />
            <EditableField icon={MapPin} label="State" fieldKey="state" />
            <EditableField icon={MapPin} label="Address" fieldKey="address" />
          </div>

          {/* ─── PROFESSIONAL DETAILS ─── */}
          <Separator />
          <div>
            <SectionTitle>Professional Details</SectionTitle>
            <EditableField icon={Calendar} label="Experience (Years)" fieldKey="experience_years" type="number" />
            <EditableField icon={Briefcase} label="Current Role" fieldKey="current_role" />
            <EditableField icon={Briefcase} label="Current / Previous Company" fieldKey="current_company" />
            <EditableField icon={Briefcase} label="LinkedIn URL" fieldKey="linkedin_url" />
            <EditableField icon={Briefcase} label="Skills (comma-separated)" fieldKey="skills" />
            <EditableField icon={Briefcase} label="Expertise Areas (comma-separated)" fieldKey="expertise_areas" />
            <EditableField icon={Briefcase} label="Teaching Languages (comma-separated)" fieldKey="teaching_languages" />

            {!editMode && (
              <InfoRow icon={Briefcase} label="Trainer Type" value={trainer.trainer_type ? trainer.trainer_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : null} />
            )}

            <div className="mt-2">
              <SectionTitle>Bio</SectionTitle>
              {editMode ? (
                <div className="flex items-start gap-2.5">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">About / Bio</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-primary gap-0.5"
                        disabled={requestingField === "Bio"}
                        onClick={() => handleRequestUpdate("Bio")}
                      >
                        {requestingField === "Bio" ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                        Request
                      </Button>
                    </div>
                    <Textarea
                      value={editForm.bio}
                      onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                      className="text-sm"
                      rows={4}
                    />
                  </div>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${trainer.bio ? "text-foreground" : "text-muted-foreground italic"}`}>
                  {trainer.bio || NP}
                </p>
              )}
            </div>
          </div>

          {/* ─── BANK DETAILS ─── */}
          <Separator />
          <div>
            <SectionTitle>Bank / Payout Details</SectionTitle>
            <EditableField icon={IndianRupee} label="Account Holder Name" fieldKey="account_holder_name" />
            <EditableField icon={IndianRupee} label="Bank Account Number" fieldKey="bank_account_number" />
            <EditableField icon={IndianRupee} label="IFSC Code" fieldKey="ifsc_code" />
            <EditableField icon={IndianRupee} label="UPI ID" fieldKey="upi_id" />
          </div>

          {/* ─── DOCUMENTS & MEDIA ─── */}
          <Separator />
          <div>
            <SectionTitle>Documents & Media</SectionTitle>

            {/* Profile Photo */}
            <div className="py-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-muted-foreground">Profile Photo</p>
                {profile?.profile_picture_url && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{hidePhoto ? "Hidden" : "Visible"} on website</span>
                    <Switch
                      checked={!hidePhoto}
                      onCheckedChange={handleTogglePhoto}
                      disabled={togglingPhoto}
                      className="h-5 w-9"
                    />
                  </div>
                )}
              </div>
              {profile?.profile_picture_url ? (
                <div className="relative">
                  <img src={profile.profile_picture_url} alt="Profile" className={`w-20 h-20 rounded-lg object-cover border ${hidePhoto ? "opacity-40 grayscale" : ""}`} loading="lazy" />
                  {hidePhoto && (
                    <div className="absolute inset-0 w-20 h-20 rounded-lg flex items-center justify-center bg-background/50">
                      <EyeOff className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
              <FileUploadButton field="profile_photo" label="Photo" accept="image/*" />
            </div>

            {/* Resume */}
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground mb-1">Resume</p>
              {resumeDoc?.document_url ? (
                resumeDoc.resolved_url ? (
                  <a href={resumeDoc.resolved_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Download className="w-3.5 h-3.5" /> Download Resume
                  </a>
                ) : (
                  <button
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    onClick={async () => {
                      const url = await resolveStorageUrl(resumeDoc.document_url);
                      if (url) window.open(url, "_blank");
                    }}
                  >
                    <Download className="w-3.5 h-3.5" /> Download Resume
                  </button>
                )
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
              <FileUploadButton field="resume" label="Resume" accept=".pdf,.doc,.docx" />
            </div>

            {/* Aadhaar / Govt ID */}
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground mb-1">Government ID / Aadhaar ({trainer.govt_id_type || "aadhaar"})</p>
              {trainer.aadhaar_url ? (
                signedUrls.aadhaar ? (
                  <a href={signedUrls.aadhaar} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Download className="w-3.5 h-3.5" /> Download ID
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">Loading…</span>
                )
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
              <FileUploadButton field="aadhaar" label="Aadhaar/ID" accept="image/*,.pdf" />
            </div>

            {/* Verification Selfie */}
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground mb-1">Verification Selfie</p>
              {trainer.verification_selfie_url ? (
                <p className="text-sm text-primary">✓ Uploaded</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
              <FileUploadButton field="selfie" label="Selfie" accept="image/*" />
            </div>

            {/* Intro Video */}
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground mb-1">Intro Video</p>
              {trainer.intro_video_url ? (
                <a href={trainer.intro_video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">▶ View Intro Video</a>
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
              <FileUploadButton field="intro_video" label="Intro Video" accept="video/*" />
            </div>

            {/* Demo Video */}
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground mb-1">Demo Video</p>
              {trainer.demo_video_url ? (
                <a href={trainer.demo_video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">▶ View Demo Video</a>
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
              <FileUploadButton field="demo_video" label="Demo Video" accept="video/*" />
            </div>

            {/* Curriculum PDF */}
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground mb-1">Curriculum PDF</p>
              {trainer.curriculum_pdf_url ? (
                <a href={trainer.curriculum_pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">📄 View PDF</a>
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
              <FileUploadButton field="curriculum_pdf" label="Curriculum PDF" accept=".pdf" />
            </div>
          </div>

          {/* ─── REFERRAL INFORMATION ─── */}
          <Separator />
          <div>
            <SectionTitle>Referral Information</SectionTitle>
            <InfoRow icon={User} label="Referred By" value={referralInfo?.referrerName || trainer.referred_by} />
            <InfoRow icon={Gift} label="Own Referral Code" value={trainer.referral_code} />
          </div>

          {/* ─── COURSES ─── */}
          <Separator />
          <div>
            <SectionTitle>Courses ({courses.length})</SectionTitle>
            {loadingCourses ? (
              <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No courses created</p>
            ) : (
              <div className="space-y-2">
                {courses.map(c => {
                  const statusColor = c.approval_status === "approved" ? "bg-emerald-50 text-emerald-700" :
                    c.approval_status === "rejected" ? "bg-destructive/10 text-destructive" :
                    c.approval_status === "changes_requested" ? "bg-orange-50 text-orange-700" :
                    "bg-amber-50 text-amber-700";
                  return (
                    <div key={c.id} className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="text-sm font-medium text-foreground truncate">{c.title}</h5>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor}`}>
                          {c.approval_status === "changes_requested" ? "Changes" : c.approval_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />₹{Number(c.course_fee).toLocaleString("en-IN")}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration_days} days</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{c.total_sessions} sessions</span>
                        {c.sessions_per_week && <span>{c.sessions_per_week}x/week</span>}
                        <span>{c.level}</span>
                        <span>{c.language}</span>
                      </div>
                      {c.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(c.has_free_trial || c.free_trial_enabled) && <Badge variant="secondary" className="text-[10px]">Free Trial</Badge>}
                        {c.intro_video_url && <a href={c.intro_video_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">▶ Intro</a>}
                        {c.curriculum_pdf_url && <span className="text-[10px] text-muted-foreground">📄 PDF</span>}
                        {c.verification_selfie_url && <span className="text-[10px] text-muted-foreground">🤳 Selfie</span>}
                      </div>
                      {c.what_you_learn?.length > 0 && (
                        <div className="mt-1.5">
                          <p className="text-[10px] text-muted-foreground font-medium">What students learn:</p>
                          <ul className="text-[11px] text-muted-foreground mt-0.5">
                            {c.what_you_learn.slice(0, 3).map((item: string, i: number) => (
                              <li key={i}>• {item}</li>
                            ))}
                            {c.what_you_learn.length > 3 && <li className="text-[10px]">+{c.what_you_learn.length - 3} more</li>}
                          </ul>
                        </div>
                      )}
                      {c.weekly_curriculum?.summary && (
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 italic">{c.weekly_curriculum.summary}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">Created {formatDateIST(c.created_at)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rejection reason */}
          {trainer.approval_status === "rejected" && trainer.rejection_reason && (
            <>
              <Separator />
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <h4 className="text-sm font-semibold text-destructive mb-1">Rejection Reason</h4>
                <p className="text-sm text-muted-foreground">{trainer.rejection_reason}</p>
              </div>
            </>
          )}

          {/* Application date */}
          <Separator />
          <p className="text-xs text-muted-foreground">Applied on {formatLongDateIST(trainer.created_at)}</p>

          {/* ─── SAVE BUTTON (sticky at bottom in edit mode) ─── */}
          {editMode && (
            <div className="sticky bottom-0 bg-background border-t pt-3 pb-2 -mx-6 px-6">
              <Button className="w-full gap-1.5" onClick={handleSaveAll} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving All Changes..." : "Save All Changes"}
              </Button>
            </div>
          )}

          {/* ─── EMAIL BUTTON ─── */}
          <div className="pt-1">
            <Button
              variant="outline"
              className="w-full gap-1.5 text-sm"
              onClick={() => {
                setEmailSubject("Message from SkillMitra Admin");
                setEmailBody("");
                setEmailDialogOpen(true);
              }}
              disabled={!profile?.email}
            >
              <Send className="w-4 h-4" /> Email {profile?.full_name || "Trainer"}
            </Button>
          </div>

          {/* ─── EMAIL DIALOG ─── */}
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Email to {profile?.full_name || "Trainer"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="email-to">To</Label>
                  <Input id="email-to" value={profile?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-body">Message</Label>
                  <Textarea
                    id="email-body"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Type your message here..."
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                <Button
                  disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim()}
                  onClick={async () => {
                    setSendingEmail(true);
                    try {
                      const { error } = await supabase.functions.invoke("send-email", {
                        body: {
                          to: profile?.email,
                          subject: emailSubject,
                          html: `<p>Hi ${profile?.full_name || "Trainer"},</p><p>${emailBody.replace(/\n/g, "<br/>")}</p><p>Best regards,<br/>SkillMitra Admin Team</p>`,
                        },
                      });
                      if (error) throw error;
                      toast.success("Email sent successfully!");
                      setEmailDialogOpen(false);
                    } catch (err: any) {
                      console.error("Send email failed:", err);
                      toast.error("Failed to send email. Please try again.");
                    } finally {
                      setSendingEmail(false);
                    }
                  }}
                >
                  {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sendingEmail ? "Sending..." : "Send"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── ACTION BUTTONS ─── */}
          <div className="flex flex-wrap gap-2 pt-1">
            {isPending && (
              <>
                <Button className="flex-1 gap-1.5" onClick={() => onApprove(trainer.id)}>
                  <Check className="w-4 h-4" /> Approve
                </Button>
                <Button variant="destructive" className="flex-1 gap-1.5" onClick={() => onReject(trainer.id)}>
                  <X className="w-4 h-4" /> Reject
                </Button>
              </>
            )}
            {onEdit && !editMode && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onEdit(trainer)}>
                <Pencil className="w-3.5 h-3.5" /> Edit (Modal)
              </Button>
            )}
            {trainer.approval_status === "approved" && onSuspend && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs border-orange-300 text-orange-600 hover:bg-orange-50" onClick={() => onSuspend(trainer)}>
                <Shield className="w-3.5 h-3.5" /> Suspend
              </Button>
            )}
            {onRemove && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => onRemove(trainer)}>
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TrainerDetailDrawer;
