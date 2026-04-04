import { useState, useEffect } from "react";
import { User, Briefcase, Globe, Linkedin, MapPin, Phone, Mail, MessageSquare, BookOpen, Clock, Languages, AlertTriangle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TrainerLayout from "@/components/layouts/TrainerLayout";
import { Skeleton } from "@/components/ui/skeleton";

const NP = "Not provided";

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: any }) => {
  const display = value ? String(value) : NP;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm ${display === NP ? "italic text-muted-foreground" : "text-foreground"}`}>{display}</p>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-xl p-5 space-y-1">
    <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
    {children}
  </div>
);

const TrainerViewProfile = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trainer, setTrainer] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: t } = await supabase.from("trainers").select("*").eq("user_id", user.id).maybeSingle();
      setTrainer(t);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <TrainerLayout>
        <div className="max-w-3xl mx-auto space-y-4 p-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      </TrainerLayout>
    );
  }

  const email = profile?.email || user?.email || NP;

  return (
    <TrainerLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3 mb-2">
          {profile?.profile_picture_url ? (
            <img src={profile.profile_picture_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <User className="w-7 h-7 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">{profile?.full_name || "Trainer"}</h1>
            <p className="text-sm text-muted-foreground">{email}</p>
            {trainer?.approval_status && (
              <Badge variant={trainer.approval_status === "approved" ? "default" : "secondary"} className="mt-1 text-xs">
                {trainer.approval_status}
              </Badge>
            )}
          </div>
        </div>

        <Section title="Personal Details">
          <InfoRow icon={User} label="Full Name" value={profile?.full_name} />
          <InfoRow icon={Mail} label="Email" value={email} />
          <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
          <InfoRow icon={MessageSquare} label="WhatsApp" value={trainer?.whatsapp} />
          <InfoRow icon={MapPin} label="City" value={profile?.city} />
          <InfoRow icon={MapPin} label="State" value={profile?.state} />
        </Section>

        <Section title="Professional Details">
          <InfoRow icon={Briefcase} label="Current Role" value={trainer?.current_role} />
          <InfoRow icon={Briefcase} label="Current Company" value={trainer?.current_company} />
          <InfoRow icon={Clock} label="Experience (years)" value={trainer?.experience_years} />
          <InfoRow icon={Linkedin} label="LinkedIn" value={trainer?.linkedin_url} />
          <InfoRow icon={Globe} label="Portfolio" value={trainer?.portfolio_url} />
          <div className="py-2">
            <p className="text-xs text-muted-foreground mb-1.5">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {trainer?.skills?.length ? trainer.skills.map((s: string) => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              )) : <span className="text-sm italic text-muted-foreground">{NP}</span>}
            </div>
          </div>
          <div className="py-2">
            <p className="text-xs text-muted-foreground mb-1.5">Teaching Languages</p>
            <div className="flex flex-wrap gap-1.5">
              {trainer?.teaching_languages?.length ? trainer.teaching_languages.map((l: string) => (
                <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
              )) : <span className="text-sm italic text-muted-foreground">{NP}</span>}
            </div>
          </div>
        </Section>

        <Section title="About">
          <div className="py-2">
            <p className="text-xs text-muted-foreground mb-1">Bio</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{trainer?.bio || NP}</p>
          </div>
          <div className="py-2">
            <p className="text-xs text-muted-foreground mb-1">Course Description</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{trainer?.course_description || NP}</p>
          </div>
        </Section>

        <Section title="Availability & Schedule">
          <InfoRow icon={Clock} label="Trainer Type" value={trainer?.trainer_type} />
          <InfoRow icon={Clock} label="Session Duration" value={trainer?.session_duration_per_day} />
          <InfoRow icon={Clock} label="Weekend Availability" value={trainer?.weekend_availability} />
          <InfoRow icon={Clock} label="Course Duration" value={trainer?.course_duration} />
          <InfoRow icon={BookOpen} label="Course Fee" value={trainer?.course_fee ? `₹${trainer.course_fee}` : null} />
          <div className="py-2">
            <p className="text-xs text-muted-foreground mb-1.5">Available Time Bands</p>
            <div className="flex flex-wrap gap-1.5">
              {trainer?.available_time_bands?.length ? trainer.available_time_bands.map((b: string) => (
                <Badge key={b} variant="outline" className="text-xs">{b}</Badge>
              )) : <span className="text-sm italic text-muted-foreground">{NP}</span>}
            </div>
          </div>
        </Section>

        {/* Security notices */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Profile Editing Disabled</p>
              <p className="text-sm text-muted-foreground mt-1">
                Profile editing is disabled to prevent unauthorized data changes. To request any changes, please email{" "}
                <a href={`mailto:contact@skillmitra.online?subject=${encodeURIComponent("Request to update my trainer profile")}&body=${encodeURIComponent(`Registered email: ${email}\n\nPlease describe the changes you need:\n`)}`} className="text-primary underline font-medium">
                  contact@skillmitra.online
                </a>{" "}
                from your registered email address.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground italic">
              The edit option has been disabled to avoid any unnecessary data breach.
            </p>
          </div>
        </div>
      </div>
    </TrainerLayout>
  );
};

export default TrainerViewProfile;
