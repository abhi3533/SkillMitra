import { useState, useEffect } from "react";
import { Bell, Settings, ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Prefs {
  session_24h_email: boolean;
  session_24h_inapp: boolean;
  session_1h_email: boolean;
  session_1h_inapp: boolean;
  session_15m_inapp: boolean;
  missed_session_inapp: boolean;
  payment_due_email: boolean;
  payment_due_inapp: boolean;
  low_attendance_inapp: boolean;
}

interface EmailPrefs {
  match_emails_enabled: boolean;
  digest_emails_enabled: boolean;
  profile_view_emails_enabled: boolean;
}

const defaultPrefs: Prefs = {
  session_24h_email: true, session_24h_inapp: true,
  session_1h_email: true, session_1h_inapp: true,
  session_15m_inapp: true, missed_session_inapp: true,
  payment_due_email: true, payment_due_inapp: true,
  low_attendance_inapp: true,
};

const defaultEmailPrefs: EmailPrefs = {
  match_emails_enabled: true,
  digest_emails_enabled: true,
  profile_view_emails_enabled: true,
};

const NotificationPreferences = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [emailPrefs, setEmailPrefs] = useState<EmailPrefs>(defaultEmailPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data }, { data: ep }] = await Promise.all([
        (supabase
          .from("notification_preferences" as any)
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle() as any),
        supabase
          .from("email_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (data) {
        setPrefs({
          session_24h_email: data.session_24h_email,
          session_24h_inapp: data.session_24h_inapp,
          session_1h_email: data.session_1h_email,
          session_1h_inapp: data.session_1h_inapp,
          session_15m_inapp: data.session_15m_inapp,
          missed_session_inapp: data.missed_session_inapp,
          payment_due_email: data.payment_due_email,
          payment_due_inapp: data.payment_due_inapp,
          low_attendance_inapp: data.low_attendance_inapp,
        });
      }
      if (ep) {
        setEmailPrefs({
          match_emails_enabled: ep.match_emails_enabled,
          digest_emails_enabled: ep.digest_emails_enabled,
          profile_view_emails_enabled: ep.profile_view_emails_enabled,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const updatePref = async (key: keyof Prefs, value: boolean) => {
    if (!user) return;
    setPrefs(prev => ({ ...prev, [key]: value }));
    setSaving(true);

    const { data: existing } = await (supabase
      .from("notification_preferences" as any)
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle() as any);

    if (existing) {
      await (supabase.from("notification_preferences" as any) as any).update({ [key]: value }).eq("user_id", user.id);
    } else {
      await (supabase.from("notification_preferences" as any) as any).insert({ user_id: user.id, ...prefs, [key]: value });
    }

    setSaving(false);
    toast({ title: "Preference updated", description: `${key.replace(/_/g, " ")} is now ${value ? "on" : "off"}` });
  };

  const updateEmailPref = async (key: keyof EmailPrefs, value: boolean) => {
    if (!user) return;
    setEmailPrefs(prev => ({ ...prev, [key]: value }));
    setSaving(true);

    const { data: existing } = await supabase
      .from("email_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("email_preferences").update({ [key]: value, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    } else {
      await supabase.from("email_preferences").insert({ user_id: user.id, ...emailPrefs, [key]: value });
    }

    setSaving(false);
    toast({ title: "Preference updated", description: `${key.replace(/_/g, " ")} is now ${value ? "on" : "off"}` });
  };

  const backPath = role === "trainer" ? "/trainer/dashboard" : "/student/dashboard";

  const sections = [
    {
      title: "Matching & Discovery Emails",
      icon: "🎯",
      items: [
        { label: "New match notifications — Email", key: "match_emails_enabled" as keyof EmailPrefs, description: "Get notified when a new trainer/student matches your profile" },
        { label: "Weekly digest — Email", key: "digest_emails_enabled" as keyof EmailPrefs, description: "Top recommended matches every Monday at 9 AM" },
        { label: "Profile view alerts — Email", key: "profile_view_emails_enabled" as keyof EmailPrefs, description: "Know when someone views your profile" },
      ],
    },
  ];

  const sessionSections = [
    {
      title: "Session Reminders",
      icon: "📅",
      items: [
        { label: "24 hours before — Email", key: "session_24h_email" as keyof Prefs },
        { label: "24 hours before — In-app", key: "session_24h_inapp" as keyof Prefs },
        { label: "1 hour before — Email", key: "session_1h_email" as keyof Prefs },
        { label: "1 hour before — In-app", key: "session_1h_inapp" as keyof Prefs },
        { label: "15 minutes before — In-app", key: "session_15m_inapp" as keyof Prefs },
      ],
    },
    {
      title: "Other Notifications",
      icon: "🔔",
      items: [
        { label: "Missed session alerts", key: "missed_session_inapp" as keyof Prefs },
        { label: "Payment/subscription reminders — Email", key: "payment_due_email" as keyof Prefs },
        { label: "Payment/subscription reminders — In-app", key: "payment_due_inapp" as keyof Prefs },
        { label: "Low attendance warnings", key: "low_attendance_inapp" as keyof Prefs },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b px-4 lg:px-8 h-16 flex items-center gap-4">
        <a href={backPath}><ArrowLeft className="w-5 h-5 text-muted-foreground" /></a>
        <Settings className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">Notification Preferences</h1>
      </header>

      <div className="max-w-xl mx-auto p-4 lg:p-8">
        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-card rounded-xl border animate-pulse" />)}</div>
        ) : (
          <div className="space-y-8">
            {/* Match email preferences */}
            {sections.map(section => (
              <div key={section.title}>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                  <span>{section.icon}</span> {section.title}
                </h2>
                <div className="bg-card rounded-xl border divide-y">
                  {section.items.map(item => (
                    <div key={item.key} className="px-4 py-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{item.label}</span>
                        <Switch
                          checked={emailPrefs[item.key]}
                          onCheckedChange={(val) => updateEmailPref(item.key, val)}
                        />
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Session notification preferences */}
            {sessionSections.map(section => (
              <div key={section.title}>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                  <span>{section.icon}</span> {section.title}
                </h2>
                <div className="bg-card rounded-xl border divide-y">
                  {section.items.map(item => (
                    <div key={item.key} className="flex items-center justify-between px-4 py-3.5">
                      <span className="text-sm text-foreground">{item.label}</span>
                      <Switch
                        checked={prefs[item.key]}
                        onCheckedChange={(val) => updatePref(item.key, val)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-xs font-semibold text-foreground mb-1">About Smart Reminders</p>
              <p className="text-xs text-muted-foreground">
                Session reminders are sent automatically. Match emails are limited to 1 per day per type.
                Weekly digests are sent every Monday at 9 AM. You can unsubscribe from match emails anytime.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPreferences;
