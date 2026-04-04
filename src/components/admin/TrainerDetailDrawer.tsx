import { useState, useEffect, useCallback } from "react";
import { formatLongDateIST } from "@/lib/dateUtils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, ExternalLink, FileText, User, Briefcase, MapPin, Phone, Mail, Globe, Calendar, CreditCard, GraduationCap, Shield, Download, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TrainerDetailDrawerProps {
  trainer: any;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

/** Resolve a storage reference to a viewable URL.
 *  - Full https URLs are returned as-is (public bucket files or already resolved).
 *  - Relative paths are treated as private-bucket paths and resolved via signed URL.
 */
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

const TrainerDetailDrawer = ({ trainer, open, onClose, onApprove, onReject }: TrainerDetailDrawerProps) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [referralInfo, setReferralInfo] = useState<{ referrerName: string; code: string; status: string } | null>(null);

  // Resolve signed URLs for private bucket files
  const resolveUrls = useCallback(async (t: any) => {
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
  }, []);

  useEffect(() => {
    if (!trainer || !open) return;
    setSignedUrls({});
    resolveUrls(trainer);

    (async () => {
      setLoadingDocs(true);
      const { data } = await supabase
        .from("trainer_documents")
        .select("*")
        .eq("trainer_id", trainer.id)
        .order("uploaded_at", { ascending: false });

      // Resolve signed URLs for each document
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
  }, [trainer, open, resolveUrls]);

  if (!trainer) return null;

  const profile = trainer.profiles;
  const isPending = trainer.approval_status === "pending";

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number | null | undefined }) => (
    value ? (
      <div className="flex items-start gap-2.5 py-1.5">
        <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="text-sm text-foreground break-words">{value}</p>
        </div>
      </div>
    ) : null
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Trainer Application — Full Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Profile Header with Photo */}
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

          {/* Selfie for verification */}
          {trainer.selfie_url && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Verification Selfie</h4>
                <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-border">
                  {signedUrls.selfie ? (
                    <img src={signedUrls.selfie} alt="Selfie" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-muted animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Internal verification only — not shown to students</p>
              </div>
            </>
          )}

          <Separator />

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Contact Information</h4>
            <InfoRow icon={Mail} label="Email" value={profile?.email} />
            <InfoRow icon={Phone} label="Mobile" value={profile?.phone} />
            <InfoRow icon={Phone} label="WhatsApp" value={trainer.whatsapp} />
            <InfoRow icon={MapPin} label="Location" value={[profile?.city, profile?.state].filter(Boolean).join(", ")} />
            <InfoRow icon={MapPin} label="Address" value={trainer.address} />
            <InfoRow icon={MapPin} label="PIN Code" value={trainer.pincode} />
            <InfoRow icon={User} label="Gender" value={profile?.gender} />
            <InfoRow icon={Calendar} label="Date of Birth" value={trainer.dob} />
          </div>

          <Separator />

          {/* Professional Info */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Professional Details</h4>
            <InfoRow icon={Briefcase} label="Current Role" value={trainer.current_role} />
            <InfoRow icon={Briefcase} label="Company" value={trainer.current_company} />
            <InfoRow icon={Mail} label="Work Email" value={trainer.work_email} />
            <InfoRow icon={Calendar} label="Experience" value={trainer.experience_years ? `${trainer.experience_years} years` : null} />
            <InfoRow icon={Globe} label="LinkedIn" value={trainer.linkedin_url} />
            <InfoRow icon={Globe} label="Portfolio" value={trainer.portfolio_url} />
            {trainer.previous_companies?.length > 0 && (
              <div className="flex items-start gap-2.5 py-1.5">
                <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Previous Companies</p>
                  <p className="text-sm text-foreground">{trainer.previous_companies.join(", ")}</p>
                </div>
              </div>
            )}
            {trainer.verification_method && (
              <InfoRow icon={Shield} label="Verification" value={`${trainer.verification_method}: ${trainer.verification_value || "—"}`} />
            )}
          </div>

          {/* Skills */}
          {trainer.skills?.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {trainer.skills.map((skill: string) => (
                    <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                  ))}
                </div>
                {trainer.secondary_skill && (
                  <p className="text-xs text-muted-foreground mt-2">Secondary: {trainer.secondary_skill}</p>
                )}
              </div>
            </>
          )}

          {/* Expertise Areas */}
          {trainer.expertise_areas?.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Areas of Expertise</h4>
                <div className="flex flex-wrap gap-1.5">
                  {trainer.expertise_areas.map((area: string) => (
                    <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Teaching Languages */}
          {trainer.teaching_languages?.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Teaching Languages</h4>
                <div className="flex flex-wrap gap-1.5">
                  {trainer.teaching_languages.map((lang: string) => (
                    <Badge key={lang} variant="secondary" className="text-xs">{lang}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Bio */}
          {trainer.bio && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Bio / Course Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{trainer.bio}</p>
              </div>
            </>
          )}

          {/* Course Details */}
          {(trainer.course_title || trainer.course_fee) && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Course Details</h4>
                <InfoRow icon={GraduationCap} label="Course Title" value={trainer.course_title} />
                <InfoRow icon={Calendar} label="Duration" value={trainer.course_duration} />
                <InfoRow icon={CreditCard} label="Course Fee" value={trainer.course_fee ? `₹${trainer.course_fee}` : null} />
                {trainer.course_description && trainer.course_description !== trainer.bio && (
                  <div className="py-1.5">
                    <p className="text-[11px] text-muted-foreground">Description</p>
                    <p className="text-sm text-foreground leading-relaxed">{trainer.course_description}</p>
                  </div>
                )}
                <InfoRow icon={FileText} label="Course Materials" value={trainer.course_materials} />
              </div>
            </>
          )}

          {/* Services Offered */}
          {trainer.services_offered?.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Services Offered</h4>
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

          {/* Intro / Demo Video */}
          {(trainer.intro_video_url || trainer.demo_video_url || trainer.curriculum_pdf_url) && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Media</h4>
                {trainer.demo_video_url && (
                  <a href={trainer.demo_video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline mb-1">
                    <ExternalLink className="w-3.5 h-3.5" /> Demo Video
                  </a>
                )}
                {trainer.intro_video_url && (
                  <a href={trainer.intro_video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline mb-1">
                    <ExternalLink className="w-3.5 h-3.5" /> Intro Video
                  </a>
                )}
                {trainer.curriculum_pdf_url && (
                  <a
                    href={signedUrls.curriculum_pdf || trainer.curriculum_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" /> Curriculum PDF
                  </a>
                )}
              </div>
            </>
          )}

          {/* Payment Info */}
          {(trainer.bank_account_number || trainer.upi_id) && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Payment Details</h4>
                <InfoRow icon={CreditCard} label="Account Holder" value={trainer.account_holder_name} />
                <InfoRow icon={CreditCard} label="Bank Account" value={trainer.bank_account_number ? `****${trainer.bank_account_number.slice(-4)}` : null} />
                <InfoRow icon={CreditCard} label="IFSC" value={trainer.ifsc_code} />
                <InfoRow icon={CreditCard} label="UPI ID" value={trainer.upi_id} />
                <InfoRow icon={Shield} label="Govt ID Type" value={trainer.govt_id_type} />
              </div>
            </>
          )}

          {/* Documents */}
          <Separator />
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Uploaded Documents</h4>
            {trainer.aadhaar_url && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Aadhaar / Govt ID</p>
                    <p className="text-[11px] text-muted-foreground">{trainer.govt_id_type || "aadhaar"}</p>
                  </div>
                </div>
                {signedUrls.aadhaar ? (
                  <a href={signedUrls.aadhaar} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1"><Download className="w-3 h-3" /> View</Button>
                  </a>
                ) : (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" disabled>Loading…</Button>
                )}
              </div>
            )}
            {loadingDocs ? (
              <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : documents.length === 0 && !trainer.aadhaar_url ? (
              <p className="text-sm text-muted-foreground">No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
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

          {/* Rejection reason if rejected */}
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
