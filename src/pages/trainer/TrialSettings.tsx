import { useState, useEffect } from "react";
import { Save, Loader2, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import TrainerLayout from "@/components/layouts/TrainerLayout";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];

interface TrialSlot {
  day: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const TrainerTrialSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [maxTrials, setMaxTrials] = useState(5);
  const [slots, setSlots] = useState<TrialSlot[]>(
    DAYS.map((_, i) => ({ day: i, enabled: false, startTime: "09:00", endTime: "12:00" }))
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).maybeSingle();
      if (!trainer) { setLoading(false); return; }
      setTrainerId(trainer.id);

      const { data: settings } = await supabase
        .from("trainer_trial_settings")
        .select("*")
        .eq("trainer_id", trainer.id)
        .maybeSingle();

      if (settings) {
        setMaxTrials(settings.max_trials_per_month || 5);
        const saved = settings.trial_availability as any;
        if (saved && Array.isArray(saved)) {
          setSlots(prev => prev.map(slot => {
            const match = saved.find((s: any) => s.day === slot.day);
            return match ? { ...slot, ...match } : slot;
          }));
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const updateSlot = (day: number, updates: Partial<TrialSlot>) => {
    setSlots(prev => prev.map(s => s.day === day ? { ...s, ...updates } : s));
  };

  const handleSave = async () => {
    if (!trainerId) return;
    setSaving(true);
    try {
      const payload = {
        trainer_id: trainerId,
        max_trials_per_month: maxTrials,
        trial_availability: slots as any,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("trainer_trial_settings")
        .select("id")
        .eq("trainer_id", trainerId)
        .maybeSingle();

      if (existing) {
        await supabase.from("trainer_trial_settings").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("trainer_trial_settings").insert(payload);
      }

      toast({ title: "Settings saved! ✅", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TrainerLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </TrainerLayout>
    );
  }

  return (
    <TrainerLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Free Trial Settings</h1>
          <p className="mt-1 text-muted-foreground">Configure your free trial availability and limits</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="hero-gradient border-0 gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </Button>
      </div>

      {/* Max trials per month */}
      <div className="mt-6 bg-card rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Monthly Trial Limit</h2>
        </div>
        <div className="max-w-xs">
          <Label>Maximum free trials per month</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={maxTrials}
            onChange={e => setMaxTrials(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">Students won't be able to book free trials once this limit is reached each month.</p>
        </div>
      </div>

      {/* Trial availability slots */}
      <div className="mt-4 bg-card rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Trial Availability</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Set specific days and time slots when you're available for free trial sessions. This is separate from your regular session availability.</p>
        
        <div className="space-y-3">
          {slots.map(slot => (
            <div key={slot.day} className={`flex items-center gap-4 p-3 rounded-lg border ${slot.enabled ? "bg-primary/5 border-primary/20" : "bg-muted/30"}`}>
              <Switch
                checked={slot.enabled}
                onCheckedChange={checked => updateSlot(slot.day, { enabled: checked })}
              />
              <span className={`w-24 text-sm font-medium ${slot.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                {DAYS[slot.day]}
              </span>
              {slot.enabled && (
                <div className="flex items-center gap-2">
                  <Select value={slot.startTime} onValueChange={v => updateSlot(slot.day, { startTime: v })}>
                    <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">to</span>
                  <Select value={slot.endTime} onValueChange={v => updateSlot(slot.day, { endTime: v })}>
                    <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </TrainerLayout>
  );
};

export default TrainerTrialSettings;
