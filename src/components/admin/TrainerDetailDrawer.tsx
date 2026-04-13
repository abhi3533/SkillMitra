import { useState, useEffect } from "react";
import { formatLongDateIST, formatDateIST } from "@/lib/dateUtils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, FileText, User, Briefcase, MapPin, Phone, Mail, Calendar, Shield, Download, Gift, Clock, Pencil, ShieldOff, Trash2, BookOpen, IndianRupee, Send, Loader2 } from "lucide-react";
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

  const resolveUrls = async (t: any) => {
    const urls: Record<string, string> = {};
    if (t.aadhaar_url) {
      urls.aadhaar = await resolveStorageUrl(t.aadhaar_url);
    }
    setSignedUrls(urls);
  };

  useEffect(() => {
    if (!trainer || !open) return;
    setSignedUrls({});
    setDocuments([]);
    setReferralInfo(null);
    setCourses([]);
    resolveUrls(trainer);

    // Fetch courses for this trainer
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

  const profile = trainer.profiles;
  const isPending = trainer.approval_status === "pending";

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

  const resumeDoc = documents.find(d => d.document_type === "resume");

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Trainer Application — Full Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
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
            <InfoRow icon={User} label="Full Name" value={profile?.full_name} />
            <InfoRow icon={Mail} label="Email" value={profile?.email} />
            <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
            <InfoRow icon={Phone} label="WhatsApp" value={trainer.whatsapp} />
            <InfoRow icon={Calendar} label="Date of Birth" value={trainer.dob} />
            <InfoRow icon={User} label="Gender" value={profile?.gender} />
            <InfoRow icon={MapPin} label="City" value={profile?.city} />
            <InfoRow icon={MapPin} label="State" value={profile?.state} />
          </div>

          {/* ─── PROFESSIONAL DETAILS ─── */}
          <Separator />
          <div>
            <SectionTitle>Professional Details</SectionTitle>
            <InfoRow icon={Calendar} label="Total Experience" value={trainer.experience_years ? `${trainer.experience_years} years` : null} />
            <InfoRow icon={Briefcase} label="Current Role" value={trainer.current_role} />
            <InfoRow icon={Briefcase} label="Current / Previous Company" value={trainer.current_company} />

            <div className="mt-2">
              <p className="text-[11px] text-muted-foreground mb-1">Areas of Expertise</p>
              {trainer.expertise_areas?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {trainer.expertise_areas.map((a: string) => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
            </div>

            <div className="mt-2">
              <p className="text-[11px] text-muted-foreground mb-1">Teaching Languages</p>
              {trainer.teaching_languages?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {trainer.teaching_languages.map((l: string) => <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
            </div>

            <InfoRow icon={Briefcase} label="Trainer Type" value={trainer.trainer_type ? trainer.trainer_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : null} />

            <div className="mt-2">
              <p className="text-[11px] text-muted-foreground mb-1">About You / Bio</p>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${trainer.bio ? "text-foreground" : "text-muted-foreground italic"}`}>
                {trainer.bio || NP}
              </p>
            </div>
          </div>

          {/* ─── DOCUMENTS & MEDIA ─── */}
          <Separator />
          <div>
            <SectionTitle>Documents & Media</SectionTitle>

            {/* Profile Photo */}
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground mb-1">Profile Photo</p>
              {profile?.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt="Profile" className="w-20 h-20 rounded-lg object-cover border" loading="lazy" />
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
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
                        <span>{c.level}</span>
                        <span>{c.language}</span>
                      </div>
                      {c.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                      {c.has_free_trial && <Badge variant="secondary" className="text-[10px] mt-1.5">Free Trial</Badge>}
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
            {onEdit && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onEdit(trainer)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
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
