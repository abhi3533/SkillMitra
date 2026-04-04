import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Briefcase, MapPin, Phone, Mail, Globe, Calendar, Clock, CreditCard, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ViewApplicationModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  profile: any;
}

const NP = "Not provided";

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

const ViewApplicationModal = ({ open, onClose, userId, profile }: ViewApplicationModalProps) => {
  const [trainer, setTrainer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("trainers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      setTrainer(data);
      setLoading(false);
    })();
  }, [open, userId]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your Submitted Application</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : !trainer ? (
          <p className="text-sm text-muted-foreground py-4">Application data not found.</p>
        ) : (
          <div className="space-y-5 mt-2">
            {/* Personal Details */}
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

            <Separator />

            {/* Professional Details */}
            <div>
              <SectionTitle>Professional Details</SectionTitle>
              <InfoRow icon={Briefcase} label="Current Role" value={trainer.current_role} />
              <InfoRow icon={Briefcase} label="Company" value={trainer.current_company} />
              <InfoRow icon={Mail} label="Work Email" value={trainer.work_email} />
              <InfoRow icon={Calendar} label="Experience" value={trainer.experience_years ? `${trainer.experience_years} years` : null} />
              <InfoRow icon={Globe} label="LinkedIn" value={trainer.linkedin_url} />
              <InfoRow icon={Globe} label="Portfolio" value={trainer.portfolio_url} />

              <div className="mt-2">
                <p className="text-[11px] text-muted-foreground mb-1">Skills</p>
                {trainer.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {trainer.skills.map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{NP}</p>
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

              <InfoRow icon={Briefcase} label="Trainer Type" value={trainer.trainer_type} />
            </div>

            <Separator />

            {/* About */}
            <div>
              <SectionTitle>About</SectionTitle>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${trainer.bio ? "text-foreground" : "text-muted-foreground italic"}`}>
                {trainer.bio || NP}
              </p>
            </div>

            <Separator />

            {/* Availability */}
            <div>
              <SectionTitle>Availability & Schedule</SectionTitle>
              <InfoRow icon={Briefcase} label="Trainer Type" value={trainer.trainer_type} />
              <InfoRow icon={Clock} label="Session Duration" value={trainer.session_duration ? `${trainer.session_duration} mins` : null} />
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
              <InfoRow icon={Calendar} label="Weekend Availability" value={trainer.weekend_available != null ? (trainer.weekend_available ? "Yes" : "No") : null} />
              <InfoRow icon={Calendar} label="Course Duration" value={trainer.course_duration} />
              <InfoRow icon={Clock} label="Total Hours" value={trainer.total_hours ? `${trainer.total_hours} hrs` : null} />
              <InfoRow icon={CreditCard} label="Course Fee" value={trainer.course_fee ? `₹${trainer.course_fee}` : null} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewApplicationModal;
