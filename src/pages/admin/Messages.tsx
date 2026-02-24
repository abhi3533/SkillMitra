import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Mail } from "lucide-react";

const AdminMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setMessages(data || []);
      setLoading(false);
    });
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("contact_messages").update({ status: "read" }).eq("id", id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "read" } : m));
    toast({ title: "Marked as read" });
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Contact Messages</h1>
      <div className="mt-6 bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b bg-secondary/30">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Subject</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Message</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : messages.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center">
                <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground mt-2">No messages yet</p>
              </td></tr>
            ) : messages.map(m => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-secondary/20">
                <td className="px-4 py-3 text-sm text-foreground">{m.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{m.email}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{m.subject}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{m.message}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${m.status === "unread" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{m.status}</span></td>
                <td className="px-4 py-3">{m.status === "unread" && <Button size="sm" variant="outline" onClick={() => markRead(m.id)}>Mark Read</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
