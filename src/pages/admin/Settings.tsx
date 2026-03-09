import { useState, useEffect } from "react";
import { Settings, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string>("");
  const [form, setForm] = useState({
    commission_percent: 10,
    min_payout_amount: 500,
    student_referral_reward: 200,
    trainer_referral_reward: 500,
    session_reminder_hours: 24,
    maintenance_mode: false,
    homepage_stats_override: false,
    custom_student_count: "" as string | number,
    custom_trainer_count: "" as string | number,
    custom_rating: "" as string | number,
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("platform_settings" as any).select("*").limit(1).single();
      if (data) {
        const d = data as any;
        setSettingsId(d.id);
        setForm({
          commission_percent: d.commission_percent ?? 10,
          min_payout_amount: d.min_payout_amount ?? 500,
          student_referral_reward: d.student_referral_reward ?? 200,
          trainer_referral_reward: d.trainer_referral_reward ?? 500,
          session_reminder_hours: d.session_reminder_hours ?? 24,
          maintenance_mode: d.maintenance_mode ?? false,
          homepage_stats_override: d.homepage_stats_override ?? false,
          custom_student_count: d.custom_student_count ?? "",
          custom_trainer_count: d.custom_trainer_count ?? "",
          custom_rating: d.custom_rating ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("platform_settings" as any).update({
      commission_percent: Number(form.commission_percent),
      min_payout_amount: Number(form.min_payout_amount),
      student_referral_reward: Number(form.student_referral_reward),
      trainer_referral_reward: Number(form.trainer_referral_reward),
      session_reminder_hours: Number(form.session_reminder_hours),
      maintenance_mode: form.maintenance_mode,
      homepage_stats_override: form.homepage_stats_override,
      custom_student_count: form.custom_student_count ? Number(form.custom_student_count) : null,
      custom_trainer_count: form.custom_trainer_count ? Number(form.custom_trainer_count) : null,
      custom_rating: form.custom_rating ? Number(form.custom_rating) : null,
      updated_at: new Date().toISOString(),
    } as any).eq("id", settingsId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved", description: "Platform settings updated successfully.", variant: "success" });
    }
    setSaving(false);
  };

  const Field = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <div className="sm:w-48">{children}</div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
          <p className="mt-1 text-muted-foreground">Configure platform-wide settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Commission & Payouts */}
      <div className="mt-8 bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Settings className="w-4 h-4" /> Commission & Payouts</h3>
        <Field label="Platform Commission (%)" desc="Percentage taken from each course payment">
          <Input type="number" value={form.commission_percent} onChange={e => setForm(f => ({ ...f, commission_percent: Number(e.target.value) }))} className="h-9 text-sm" />
        </Field>
        <Field label="Minimum Payout Amount (₹)" desc="Minimum balance for trainer withdrawal">
          <Input type="number" value={form.min_payout_amount} onChange={e => setForm(f => ({ ...f, min_payout_amount: Number(e.target.value) }))} className="h-9 text-sm" />
        </Field>
      </div>

      {/* Referrals */}
      <div className="mt-6 bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-2">Referral Rewards</h3>
        <Field label="Student Referral Reward (₹)" desc="Amount credited when a referred student enrolls">
          <Input type="number" value={form.student_referral_reward} onChange={e => setForm(f => ({ ...f, student_referral_reward: Number(e.target.value) }))} className="h-9 text-sm" />
        </Field>
        <Field label="Trainer Referral Reward (₹)" desc="Amount credited when a referred trainer gets approved">
          <Input type="number" value={form.trainer_referral_reward} onChange={e => setForm(f => ({ ...f, trainer_referral_reward: Number(e.target.value) }))} className="h-9 text-sm" />
        </Field>
      </div>

      {/* Notifications */}
      <div className="mt-6 bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-2">Notifications</h3>
        <Field label="Session Reminder (hours)" desc="Hours before session to send reminder">
          <Input type="number" value={form.session_reminder_hours} onChange={e => setForm(f => ({ ...f, session_reminder_hours: Number(e.target.value) }))} className="h-9 text-sm" />
        </Field>
      </div>

      {/* System */}
      <div className="mt-6 bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-2">System</h3>
        <Field label="Maintenance Mode" desc="Puts the platform in read-only mode for users">
          <Switch checked={form.maintenance_mode} onCheckedChange={v => setForm(f => ({ ...f, maintenance_mode: v }))} />
        </Field>
      </div>

      {/* Homepage Overrides */}
      <div className="mt-6 bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-2">Homepage Stats Override</h3>
        <Field label="Override Homepage Stats" desc="Use custom numbers on the homepage instead of real counts">
          <Switch checked={form.homepage_stats_override} onCheckedChange={v => setForm(f => ({ ...f, homepage_stats_override: v }))} />
        </Field>
        {form.homepage_stats_override && (
          <>
            <Field label="Custom Student Count">
              <Input type="number" value={form.custom_student_count} onChange={e => setForm(f => ({ ...f, custom_student_count: e.target.value }))} placeholder="e.g. 500" className="h-9 text-sm" />
            </Field>
            <Field label="Custom Trainer Count">
              <Input type="number" value={form.custom_trainer_count} onChange={e => setForm(f => ({ ...f, custom_trainer_count: e.target.value }))} placeholder="e.g. 50" className="h-9 text-sm" />
            </Field>
            <Field label="Custom Rating">
              <Input type="number" step="0.1" value={form.custom_rating} onChange={e => setForm(f => ({ ...f, custom_rating: e.target.value }))} placeholder="e.g. 4.8" className="h-9 text-sm" />
            </Field>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
