import { useState, useEffect } from "react";
import { formatLongDateIST } from "@/lib/dateUtils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, ExternalLink, FileText, User, Briefcase, MapPin, Phone, Mail, Globe, Calendar, CreditCard, GraduationCap, Shield, Download, Gift, Clock, Video, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TrainerDetailDrawerProps {
  trainer: any;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const resolveStorageUrl = async (
  pathOrUrl: string,
  bucket = "trainer-documents",
  expiresIn = 3600,
): Promise<string> => {
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
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

const TrainerDetailDrawer = ({ trainer, open, onClose, onApprove, onReject }: TrainerDetailDrawerProps) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [referralInfo, setReferralInfo] = useState<{ referrerName: string; code: string; status: string } | null>(null);

  const resolveUrls = async (t: any) => {
    const urls: Record<string, string> = {};
    const promises: Promise<void>[] = [];

    if (t.selfie_url) {
      promises.push(resolveStorageUrl(t.selfie_url).then(u => { urls.selfie = u; }));
    }
    if (t.aadhaar_url) {
      promises.push(resolveStorageUrl(t.aadhaar_url).then(u => { urls.aadhaar = u; }));
    }
    if (t.curriculum_pdf_url && !t.curriculum_pdf_url.startsWith("http")) {
      promises.push(resolveStorageUrl(t.curriculum_pdf_url).then(u => { urls.curriculum_pdf = u; }));
    }

    await Promise.all(promises);
    setSignedUrls(urls);
  };

  useEffect(() => {
    if (!trainer || !open) return;
    setSignedUrls({});
    setDocuments([]);
    setReferralInfo(null);
    resolveUrls(trainer);

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

    // Always check trainer_referrals by referred_id — referred_by on the trainer row
    // may not be set if the async complete-signup edge function hadn't finished yet.
    (async () => {
      const { data: refData } = await supabase
        .from("trainer_referrals")
        .select("status, referral_code, referrer_id")
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
          status: refData.status || "pending",
        });
      } else if (trainer.referred_by) {
        // Fallback: referral row doesn't exist yet but referred_by is set
        setReferralInfo({
          referrerName: "—",
          code: trainer.referred_by,
          status: "pending",
        });
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainer?.id, open]);

  if (!trainer) return null;

  const profile = trainer.profiles;
  const isPending = trainer.approval_status === "pending";

  const InfoRow = ({ icon: Icon, label, value, masked }: { icon: any; label: string; value: string | number | null | undefined; masked?: boolean }) => {
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
            <InfoRow icon={MapPin} label="PIN Code" value={trainer.pincode} />
            <InfoRow icon={MapPin} label="Address" value={trainer.address} />
          </div>

          {/* ─── PROFESSIONAL DETAILS ─── */}
          <Separator />
          <div>
            <SectionTitle>Professional Details</SectionTitle>
            <InfoRow icon={Briefcase} label="Current Role" value={trainer.current_role} />
            <InfoRow icon={Briefcase} label="Company" value={trainer.current_company} />
            <InfoRow icon={Mail} label="Work Email" value={trainer.work_email} />
            <InfoRow icon={Calendar} label="Experience" value={trainer.experience_years ? `${trainer.experience_years} years` : null} />
            <InfoRow icon={Globe} label="LinkedIn" value={trainer.linkedin_url} />
            <InfoRow icon={Globe} label="Portfolio" value={trainer.portfolio_url} />
            <InfoRow icon={Shield} label="Verification Method" value={trainer.verification_method ? `${trainer.verification_method}${trainer.verification_value ? `: ${trainer.verification_value}` : ""}` : null} />
            {trainer.previous_companies?.length > 0 && (
              <InfoRow icon={Briefcase} label="Previous Companies" value={trainer.previous_companies.join(", ")} />
            )}

            <div className="mt-2">
              <p className="text-[11px] text-muted-foreground mb-1">Skills</p>
              {trainer.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {trainer.skills.map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
              {trainer.secondary_skill && (
                <p className="text-xs text-muted-foreground mt-1">Secondary: {trainer.secondary_skill}</p>
              )}
            </div>

            <div className="mt-2">
              <p className="text-[11px] text-muted-foreground mb-1">Expertise Areas</p>
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
          </div>

          {/* ─── ABOUT ─── */}
          <Separator />
          <div>
            <SectionTitle>About the Trainer</SectionTitle>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${trainer.bio ? "text-foreground" : "text-muted-foreground italic"}`}>
              {trainer.bio || NP}
            </p>
          </div>
          <div>
            <SectionTitle>Course Description</SectionTitle>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${trainer.course_description ? "text-foreground" : "text-muted-foreground italic"}`}>
              {trainer.course_description || NP}
            </p>
          </div>

          {/* ─── AVAILABILITY & SCHEDULE ─── */}
          <Separator />
          <div>
            <SectionTitle>Availability & Schedule</SectionTitle>
            <InfoRow icon={Briefcase} label="Trainer Type" value={trainer.trainer_type ? trainer.trainer_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : null} />
            <InfoRow icon={Clock} label="Session Duration/Day" value={trainer.session_duration_per_day || null} />
            <div className="mt-1">
              <p className="text-[11px] text-muted-foreground mb-1">Available Time Bands</p>
              {trainer.available_time_bands?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {trainer.available_time_bands.map((b: string) => <Badge key={b} variant="outline" className="text-xs">{b}</Badge>)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
            </div>
            <InfoRow icon={Calendar} label="Weekend Availability" value={trainer.weekend_availability ? trainer.weekend_availability.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : null} />
            <InfoRow icon={Calendar} label="Course Schedule" value={
              [trainer.session_duration_per_day && `${trainer.session_duration_per_day} sessions`,
               (trainer as any).total_sessions && `${(trainer as any).total_sessions} Sessions`,
               trainer.course_duration && `${trainer.course_duration} Days`
              ].filter(Boolean).join(" | ") || null
            } />
            <InfoRow icon={Clock} label="Total Hours" value={(() => {
              const sessionHoursMap: Record<string, number> = { "1 Hour": 1, "1.5 Hours": 1.5, "2 Hours": 2 };
              const totalSessions = Number((trainer as any).total_sessions) || 0;
              const sessionHours = sessionHoursMap[trainer.session_duration_per_day] || 0;
              if (!sessionHours || !totalSessions) return null;
              return `${Math.round(totalSessions * sessionHours)} hrs`;
            })()} />
            <InfoRow icon={CreditCard} label="Course Fee" value={trainer.course_fee ? `₹${trainer.course_fee}` : null} />
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

            {/* Selfie */}
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground mb-1">Verification Selfie</p>
              {trainer.selfie_url ? (
                signedUrls.selfie ? (
                  <img src={signedUrls.selfie} alt="Selfie" className="w-20 h-20 rounded-lg object-cover border" loading="lazy" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted animate-pulse" />
                )
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
            </div>

            {/* Resume */}
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground mb-1">Resume</p>
              {resumeDoc?.resolved_url ? (
                <a href={resumeDoc.resolved_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Download className="w-3.5 h-3.5" /> Download Resume
                </a>
              ) : signedUrls.resume ? (
                <a href={signedUrls.resume} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Download className="w-3.5 h-3.5" /> Download Resume
                </a>
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
            </div>

            {/* Aadhaar / Govt ID */}
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground mb-1">Aadhaar / Govt ID ({trainer.govt_id_type || "aadhaar"})</p>
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

            {/* Intro Video */}
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground mb-1">Intro Video</p>
              {trainer.intro_video_url ? (
                <a href={trainer.intro_video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Video className="w-3.5 h-3.5" /> Watch Intro Video
                </a>
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
            </div>

            {/* Demo Video */}
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground mb-1">Demo Video</p>
              {trainer.demo_video_url ? (
                <a href={trainer.demo_video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Video className="w-3.5 h-3.5" /> Watch Demo Video
                </a>
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
            </div>

            {/* Curriculum PDF */}
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground mb-1">Curriculum PDF</p>
              {trainer.curriculum_pdf_url ? (
                <a href={signedUrls.curriculum_pdf || trainer.curriculum_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <FileText className="w-3.5 h-3.5" /> Download Curriculum
                </a>
              ) : (
                <p className="text-sm text-muted-foreground italic">{NP}</p>
              )}
            </div>

            {/* Other uploaded documents */}
            {loadingDocs ? (
              <div className="space-y-2 mt-2">{[1, 2].map(i => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : documents.filter(d => d.document_type !== "resume").length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-[11px] text-muted-foreground">Other Documents</p>
                {documents.filter(d => d.document_type !== "resume").map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.document_name || doc.document_type || "Document"}</p>
                        <p className="text-[11px] text-muted-foreground">{doc.document_type} • {doc.verification_status}</p>
                      </div>
                    </div>
                    {doc.resolved_url && (
                      <a href={doc.resolved_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1"><Download className="w-3 h-3" /> View</Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── BANK DETAILS (masked) ─── */}
          <Separator />
          <div>
            <SectionTitle>Bank Details</SectionTitle>
            <InfoRow icon={CreditCard} label="Account Holder Name" value={trainer.account_holder_name} />
            <InfoRow icon={CreditCard} label="Bank Account" value={trainer.bank_account_number ? `****${trainer.bank_account_number.slice(-4)}` : null} />
            <InfoRow icon={CreditCard} label="IFSC Code" value={trainer.ifsc_code} />
            <InfoRow icon={CreditCard} label="UPI ID" value={trainer.upi_id} />
          </div>

          {/* ─── REFERRAL INFO ─── */}
          <Separator />
          <div>
            <SectionTitle>Referral Information</SectionTitle>
            {referralInfo ? (
              <>
                <InfoRow icon={User} label="Referred By" value={referralInfo.referrerName} />
                <InfoRow icon={Gift} label="Referral Code Used" value={referralInfo.code} />
                <div className="flex items-start gap-2.5 py-1.5">
                  <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Bonus Status</p>
                    <Badge variant={referralInfo.status === "paid" ? "default" : referralInfo.status === "pending" ? "secondary" : "destructive"} className="text-[11px] mt-0.5">
                      {referralInfo.status === "paid" ? "₹1,500 Credited" : referralInfo.status === "pending" ? "₹1,500 Pending Approval" : referralInfo.status}
                    </Badge>
                  </div>
                </div>
              </>
            ) : (
              <>
                <InfoRow icon={User} label="Referred By" value={trainer.referred_by} />
                <InfoRow icon={Gift} label="Own Referral Code" value={trainer.referral_code} />
              </>
            )}
          </div>

          {/* Services Offered */}
          {trainer.services_offered?.length > 0 && (
            <>
              <Separator />
              <div>
                <SectionTitle>Services Offered</SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {trainer.services_offered.map((svc: string) => (
                    <Badge key={svc} variant="outline" className="text-xs">{svc}</Badge>
                  ))}
                </div>
                {trainer.additional_services_details && (
                  <p className="text-xs text-muted-foreground mt-2">{trainer.additional_services_details}</p>
                )}
              </div>
            </>
          )}

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

          {/* Action Buttons */}
          {isPending && (
            <div className="flex gap-2 pt-2">
              <Button className="flex-1 gap-1.5" onClick={() => onApprove(trainer.id)}>
                <Check className="w-4 h-4" /> Approve
              </Button>
              <Button variant="destructive" className="flex-1 gap-1.5" onClick={() => onReject(trainer.id)}>
                <X className="w-4 h-4" /> Reject
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TrainerDetailDrawer;
