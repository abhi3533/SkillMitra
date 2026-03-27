import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditTrainerModalProps {
  trainer: any;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EditTrainerModal = ({ trainer, open, onClose, onSave }: EditTrainerModalProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    state: "",
    bio: "",
    current_role: "",
    current_company: "",
    experience_years: "",
    skills: "",
    linkedin_url: "",
  });

  useEffect(() => {
    if (trainer) {
      setForm({
        full_name: trainer.profiles?.full_name || "",
        phone: trainer.profiles?.phone || "",
        city: trainer.profiles?.city || "",
        state: trainer.profiles?.state || "",
        bio: trainer.bio || "",
        current_role: trainer.current_role || "",
        current_company: trainer.current_company || "",
        experience_years: trainer.experience_years?.toString() || "",
        skills: (trainer.skills || []).join(", "),
        linkedin_url: trainer.linkedin_url || "",
      });
    }
  }, [trainer]);

  const handleSave = async () => {
    if (!trainer) return;
    setSaving(true);
    try {
      const [profileRes, trainerRes] = await Promise.all([
        supabase.from("profiles").update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          city: form.city.trim() || null,
          state: form.state.trim() || null,
        }).eq("id", trainer.user_id),
        supabase.from("trainers").update({
          bio: form.bio.trim(),
          "current_role": form.current_role.trim(),
          current_company: form.current_company.trim(),
          experience_years: form.experience_years ? parseInt(form.experience_years) : null,
          skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
          linkedin_url: form.linkedin_url.trim() || null,
        }).eq("id", trainer.id),
      ]);
      if (profileRes.error) throw profileRes.error;
      if (trainerRes.error) throw trainerRes.error;
      toast({ title: "Trainer updated", description: "Changes saved successfully." });
      onSave();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!trainer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trainer — {trainer.profiles?.full_name || "Unknown"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Current Role</Label>
              <Input value={form.current_role} onChange={e => setForm(f => ({ ...f, current_role: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Current Company</Label>
              <Input value={form.current_company} onChange={e => setForm(f => ({ ...f, current_company: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Experience (Years)</Label>
              <Input type="number" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <Input value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Skills (comma-separated)</Label>
            <Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} className="mt-1" placeholder="React, Python, Data Science" />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className="mt-1" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTrainerModal;
