import { useState } from "react";
import { Mail, Clock, Calendar, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (form.message.length < 20) {
      toast({ title: "Message must be at least 20 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert(form);
    setLoading(false);
    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thank you! We will reply within 24 hours." });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <h1 className="text-3xl font-bold text-foreground text-center">Contact Us</h1>
          <p className="mt-2 text-muted-foreground text-center">We'd love to hear from you</p>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {/* Left - Info */}
            <div className="space-y-6">
              <div className="bg-card rounded-xl border p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Email</p>
                    <a href="mailto:Contact@skillmitra.online" className="text-sm text-primary hover:underline">Contact@skillmitra.online</a>
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
                    <p className="text-sm text-muted-foreground">Monday to Saturday, 9am–6pm IST</p>
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

            {/* Right - Form */}
            <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 space-y-4">
              <div>
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" required />
              </div>
              <div>
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" required />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select a subject" /></SelectTrigger>
                  <SelectContent>
                    {["General inquiry", "Trainer application", "Payment issue", "Technical support", "Partnership", "Other"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Message <span className="text-destructive">*</span></Label>
                <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="mt-1 min-h-[120px]" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send Message"}
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
