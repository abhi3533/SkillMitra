import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Mail, Eye, Reply, Clock } from "lucide-react";
import { format } from "date-fns";

const AdminMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const { toast } = useToast();

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const markRead = async (id: string) => {
    await supabase.from("contact_messages").update({ status: "read" }).eq("id", id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "read" } : m));
  };

  const openMessage = async (msg: any) => {
    setSelectedMessage(msg);
    if (msg.status === "unread") {
      await markRead(msg.id);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;
    setReplying(true);
    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: selectedMessage.email,
          subject: `Re: ${selectedMessage.subject} — SkillMitra`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a1a;">Reply from SkillMitra</h2>
              <p style="color: #333; line-height: 1.6;">Dear ${selectedMessage.name},</p>
              <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">${replyText}</div>
              <p style="color: #333; line-height: 1.6; margin-top: 24px;">Best regards,<br/>The SkillMitra Team<br/><p style="color: #333; line-height: 1.6; margin-top: 24px;">Best regards,<br/>The SkillMitra Team<br/><a href="mailto:contact@skillmitra.online" style="color: #1A56DB;">contact@skillmitra.online</a></p></p>
            </div>
          `,
        },
      });
      if (error) throw error;
      toast({ title: "Reply sent successfully", variant: "success" });
      setReplyOpen(false);
      setReplyText("");
      await supabase.from("contact_messages").update({ status: "replied" }).eq("id", selectedMessage.id);
      setMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, status: "replied" } : m));
      setSelectedMessage((prev: any) => prev ? { ...prev, status: "replied" } : prev);
    } catch (err: any) {
      toast({ title: "Failed to send reply", description: err.message, variant: "destructive" });
    } finally {
      setReplying(false);
    }
  };

  const filteredMessages = filter === "all" ? messages : messages.filter(m => m.status === filter);
  const unreadCount = messages.filter(m => m.status === "unread").length;

  const statusColor = (status: string) => {
    if (status === "unread") return "bg-primary/10 text-primary";
    if (status === "replied") return "bg-green-100 text-green-700";
    return "bg-muted text-muted-foreground";
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contact Messages</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread message{unreadCount > 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="flex gap-2">
          {(["all", "unread", "read"] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-secondary/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Subject</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : filteredMessages.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center">
                <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground mt-2">No messages</p>
              </td></tr>
            ) : filteredMessages.map(m => (
              <tr key={m.id} className={`border-b last:border-0 hover:bg-secondary/20 cursor-pointer ${m.status === "unread" ? "bg-primary/5" : ""}`} onClick={() => openMessage(m)}>
                <td className={`px-4 py-3 text-sm ${m.status === "unread" ? "font-semibold text-foreground" : "text-foreground"}`}>{m.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{m.email}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{m.subject}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{m.created_at ? format(new Date(m.created_at), "dd MMM yyyy, hh:mm a") : "-"}</td>
                <td className="px-4 py-3"><Badge variant="secondary" className={statusColor(m.status)}>{m.status}</Badge></td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openMessage(m); }}><Eye className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage && !replyOpen} onOpenChange={(open) => { if (!open) setSelectedMessage(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">From:</span> <span className="font-medium">{selectedMessage.name}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <a href={`mailto:${selectedMessage.email}`} className="text-primary hover:underline">{selectedMessage.email}</a></div>
                <div><span className="text-muted-foreground">Phone:</span> {selectedMessage.phone || "Not provided"}</div>
                <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground" /> <span className="text-muted-foreground">{selectedMessage.created_at ? format(new Date(selectedMessage.created_at), "dd MMM yyyy, hh:mm a") : "-"}</span></div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>Close</Button>
                <Button onClick={() => setReplyOpen(true)}><Reply className="w-4 h-4 mr-2" /> Reply</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to {selectedMessage?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Replying to: {selectedMessage?.email}</p>
            <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." className="min-h-[150px]" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReplyOpen(false)}>Cancel</Button>
              <Button onClick={handleReply} disabled={replying || !replyText.trim()}>
                {replying ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminMessages;
