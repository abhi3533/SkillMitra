import { useState, useEffect } from "react";
import { formatDateTimeIST } from "@/lib/dateUtils";
import { Send, Loader2, Mail, Bell, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminCommunications = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"compose" | "history">("compose");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all_students");
  const [channel, setChannel] = useState("notification");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("admin_communications" as any).select("*").order("sent_at", { ascending: false }).limit(50);
      setHistory((data as any[]) || []);
      setLoadingHistory(false);
    })();
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Missing fields", description: "Subject and body are required.", variant: "warning" });
      return;
    }
    setSending(true);

    try {
      // Get target user IDs
      let userIds: string[] = [];
      if (audience === "all_students") {
        const { data } = await supabase.from("students").select("user_id");
        userIds = (data || []).map(s => s.user_id);
      } else if (audience === "all_trainers") {
        const { data } = await supabase.from("trainers").select("user_id");
        userIds = (data || []).map(t => t.user_id);
      } else if (audience === "all") {
        const [s, t] = await Promise.all([
          supabase.from("students").select("user_id"),
          supabase.from("trainers").select("user_id"),
        ]);
        userIds = [...(s.data || []).map(x => x.user_id), ...(t.data || []).map(x => x.user_id)];
      }

      // Create in-app notifications
      if (channel === "notification" || channel === "both") {
        const notifications = userIds.map(uid => ({
          user_id: uid,
          title: subject,
          body: body,
          type: "announcement",
          icon: "📢",
        }));
        // Insert in batches of 100
        for (let i = 0; i < notifications.length; i += 100) {
          await supabase.from("notifications").insert(notifications.slice(i, i + 100));
        }
      }

      // Log the communication
      await supabase.from("admin_communications" as any).insert({
        subject,
        body,
        target_audience: audience,
        sent_by: user?.id,
        recipient_count: userIds.length,
        channel,
      } as any);

      toast({ title: "Sent!", description: `Message sent to ${userIds.length} users.`, variant: "success" });
      setSubject("");
      setBody("");

      // Refresh history
      const { data: newHistory } = await supabase.from("admin_communications" as any).select("*").order("sent_at", { ascending: false }).limit(50);
      setHistory((newHistory as any[]) || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Communications</h1>
      <p className="mt-1 text-muted-foreground">Send announcements and notifications to users</p>

      <div className="flex gap-2 mt-6">
        <Button variant={tab === "compose" ? "default" : "outline"} size="sm" onClick={() => setTab("compose")} className="gap-1.5">
          <Send className="w-3.5 h-3.5" /> Compose
        </Button>
        <Button variant={tab === "history" ? "default" : "outline"} size="sm" onClick={() => setTab("history")} className="gap-1.5">
          <Mail className="w-3.5 h-3.5" /> Sent History
        </Button>
      </div>

      {tab === "compose" && (
        <div className="mt-6 bg-card rounded-xl border border-border p-6 max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Target Audience</label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_students">All Students</SelectItem>
                  <SelectItem value="all_trainers">All Trainers</SelectItem>
                  <SelectItem value="all">All Users (Students + Trainers)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Channel</label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification">In-App Notification</SelectItem>
                  <SelectItem value="email">Email (via Resend)</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Announcement subject..." className="h-10" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Message Body</label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message here..." rows={6} />
            </div>

            <Button onClick={handleSend} disabled={sending} className="gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send to {audience === "all" ? "All Users" : audience === "all_students" ? "All Students" : "All Trainers"}
            </Button>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="mt-6 bg-card rounded-xl border border-border overflow-hidden">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <Mail className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">No messages sent yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Subject</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Audience</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Channel</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Recipients</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any) => (
                    <tr key={h.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">{h.subject}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{(h.target_audience || "").replace("_", " ")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${h.channel === "email" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                          {h.channel === "email" ? <Mail className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                          {h.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">{h.recipient_count}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatDateTimeIST(h.sent_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCommunications;
