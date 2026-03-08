import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Mail, Clock, Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanPhone, isValidPhone, isValidEmail, getEmailTypoSuggestion } from "@/lib/formValidation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const RequiredMark = () => <span className="text-destructive ml-0.5">*</span>;

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [emailTypo, setEmailTypo] = useState<string | null>(null);
  usePageMeta({
    title: "Contact SkillMitra — Get Help & Support",
    description: "Reach out to SkillMitra for support, partnerships, or general inquiries. We respond within 24 hours.",
  });

  const markTouched = (key: string) => setTouched(t => ({ ...t, [key]: true }));
  const handlePhoneChange = (val: string) => setForm(f => ({ ...f, phone: cleanPhone(val) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, subject: true, message: true, phone: true });
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (!isValidEmail(form.email)) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    if (form.phone && !isValidPhone(form.phone)) {
      toast({ title: "Please enter a valid 10-digit Indian mobile number", variant: "destructive" });
      return;
    }
    if (form.message.length < 20) {
      toast({ title: "Message must be at least 20 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("contact-form", {
        body: form,
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: data.error, variant: "destructive" });
        return;
      }
      toast({
        title: "Your message has been sent successfully!",
        description: "We will get back to you within 24 hours.",
        variant: "success" as any,
      });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      setTouched({});
      setEmailTypo(null);
      // 60-second cooldown after successful submission
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isPhoneFilled = isValidPhone(form.phone);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <h1 className="text-3xl font-bold text-foreground text-center">Contact Us</h1>
          <p className="mt-2 text-muted-foreground text-center">We'd love to hear from you</p>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="space-y-6">
              <div className="bg-card rounded-xl border p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Email</p>
                    <a href="mailto:contact@skillmitra.online" className="text-sm text-primary hover:underline">contact@skillmitra.online</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Response Time</p>
                    <p className="text-sm text-muted-foreground">Within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Office Hours</p>
                    <p className="text-sm text-muted-foreground">Monday–Saturday, 9:00 AM–6:00 PM IST</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Location</p>
                    <p className="text-sm text-muted-foreground">India</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 space-y-4">
              <div>
                <Label>Full Name<RequiredMark /></Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} onBlur={() => markTouched("name")}
                  className={`mt-1 ${touched.name ? (form.name.trim() ? "border-green-500" : "border-destructive") : ""}`} required />
                {touched.name && !form.name.trim() && <p className="text-xs text-destructive mt-1">Name is required</p>}
              </div>
              <div>
                <Label>Email<RequiredMark /></Label>
                <Input type="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setEmailTypo(null); }}
                  onBlur={() => { markTouched("email"); setEmailTypo(getEmailTypoSuggestion(form.email)); }}
                  className={`mt-1 ${touched.email ? (isValidEmail(form.email) ? "border-green-500" : "border-destructive") : ""}`} required />
                {touched.email && !isValidEmail(form.email) && form.email.length > 0 && <p className="text-xs text-destructive mt-1">Please enter a valid email address</p>}
                {emailTypo && <p className="text-xs text-amber-600 mt-1">{emailTypo}</p>}
              </div>
              <div>
                <Label>Phone</Label>
                <div className="relative">
                  <Input value={form.phone} onChange={e => handlePhoneChange(e.target.value)} onBlur={() => markTouched("phone")} maxLength={10} inputMode="numeric"
                    className={`mt-1 pr-8 ${touched.phone && form.phone ? (isPhoneFilled ? "border-green-500" : "border-destructive") : ""}`} />
                  {isPhoneFilled && <CheckCircle2 className="w-4 h-4 text-green-500 absolute right-3 top-1/2 mt-[2px] -translate-y-1/2" />}
                </div>
                {touched.phone && form.phone && !isPhoneFilled && <p className="text-xs text-destructive mt-1">Please enter a valid 10-digit Indian mobile number</p>}
              </div>
              <div>
                <Label>Subject<RequiredMark /></Label>
                <Select value={form.subject} onValueChange={v => { setForm({ ...form, subject: v }); markTouched("subject"); }}>
                  <SelectTrigger className={`mt-1 ${touched.subject ? (form.subject ? "border-green-500" : "border-destructive") : ""}`}><SelectValue placeholder="Select a subject" /></SelectTrigger>
                  <SelectContent>
                    {["General inquiry", "Trainer application", "Payment issue", "Technical support", "Partnership", "Other"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.subject && !form.subject && <p className="text-xs text-destructive mt-1">Subject is required</p>}
              </div>
              <div>
                <Label>Message<RequiredMark /></Label>
                <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} onBlur={() => markTouched("message")}
                  className={`mt-1 min-h-[120px] ${touched.message ? (form.message.length >= 20 ? "border-green-500" : "border-destructive") : ""}`} required />
                {touched.message && form.message.length > 0 && form.message.length < 20 && <p className="text-xs text-destructive mt-1">Message must be at least 20 characters</p>}
              </div>
              <Button type="submit" disabled={loading || cooldown > 0} className="w-full">
                {loading ? "Sending..." : cooldown > 0 ? `Please wait ${cooldown}s` : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
