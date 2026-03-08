import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, ExternalLink, FileText, User, Briefcase, MapPin, Phone, Mail, Globe, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TrainerDetailDrawerProps {
  trainer: any;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const TrainerDetailDrawer = ({ trainer, open, onClose, onApprove, onReject }: TrainerDetailDrawerProps) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (!trainer || !open) return;
    (async () => {
      setLoadingDocs(true);
      const { data } = await supabase
        .from("trainer_documents")
        .select("*")
        .eq("trainer_id", trainer.id)
        .order("uploaded_at", { ascending: false });
      setDocuments(data || []);
      setLoadingDocs(false);
    })();
  }, [trainer, open]);

  if (!trainer) return null;

  const profile = trainer.profiles;
  const isPending = trainer.approval_status === "pending";

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number | null | undefined }) => (
    value ? (
      <div className="flex items-start gap-2.5 py-1.5">
        <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="text-sm text-foreground">{value}</p>
        </div>
      </div>
    ) : null
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Trainer Application</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {profile?.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <span className="text-primary font-bold text-xl">{profile?.full_name?.[0] || "T"}</span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-foreground">{profile?.full_name || "Unknown"}</h3>
              <p className="text-sm text-muted-foreground">{trainer.current_role || "Trainer"}{trainer.current_company ? ` at ${trainer.current_company}` : ""}</p>
              <Badge variant={trainer.approval_status === "approved" ? "default" : trainer.approval_status === "rejected" ? "destructive" : "secondary"} className="mt-1 text-[11px]">
                {trainer.approval_status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Contact Information</h4>
            <InfoRow icon={Mail} label="Email" value={profile?.email} />
            <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
            <InfoRow icon={MapPin} label="Location" value={[profile?.city, profile?.state].filter(Boolean).join(", ")} />
            <InfoRow icon={User} label="Gender" value={profile?.gender} />
          </div>

          <Separator />

          {/* Professional Info */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Professional Details</h4>
            <InfoRow icon={Briefcase} label="Current Role" value={trainer.current_role} />
            <InfoRow icon={Briefcase} label="Company" value={trainer.current_company} />
            <InfoRow icon={Calendar} label="Experience" value={trainer.experience_years ? `${trainer.experience_years} years` : null} />
            <InfoRow icon={Globe} label="LinkedIn" value={trainer.linkedin_url} />
            {trainer.previous_companies?.length > 0 && (
              <div className="flex items-start gap-2.5 py-1.5">
                <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Previous Companies</p>
                  <p className="text-sm text-foreground">{trainer.previous_companies.join(", ")}</p>
                </div>
              </div>
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
                <h4 className="text-sm font-semibold text-foreground mb-2">Bio</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{trainer.bio}</p>
              </div>
            </>
          )}

          {/* Intro Video */}
          {trainer.intro_video_url && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Intro Video</h4>
                <a href={trainer.intro_video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> Watch video
                </a>
              </div>
            </>
          )}

          {/* Documents */}
          <Separator />
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Uploaded Documents</h4>
            {loadingDocs ? (
              <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : documents.length === 0 ? (
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
                    {doc.document_url && (
                      <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 text-xs"><ExternalLink className="w-3 h-3" /></Button>
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
          <p className="text-xs text-muted-foreground">Applied on {new Date(trainer.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

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
