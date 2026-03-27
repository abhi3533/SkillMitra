import { useState, useEffect, useRef } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { Upload, Send, RefreshCw, Search, Download, MailPlus, CheckCircle, Clock, AlertCircle, Users, UserPlus, TrendingUp, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";

interface Invitation {
  id: string;
  email: string;
  status: string;
  invited_at: string;
  reminder_sent_at: string | null;
  signed_up_at: string | null;
  emails_sent: number;
  created_at: string;
}

const AdminTrainerInvitations = () => {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [csvEmails, setCsvEmails] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ newEmails: string[]; registered: number; duplicate: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("trainer_invitations")
      .select("*")
      .order("invited_at", { ascending: false });
    setInvitations((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchInvitations(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const emails: string[] = [];
    const lines = text.split(/[\r\n]+/);
    for (const line of lines) {
      // Support comma-separated or single email per line
      const parts = line.split(",");
      for (const part of parts) {
        const email = part.trim().toLowerCase().replace(/^["']|["']$/g, "");
        if (email && email.includes("@") && !email.startsWith("email")) {
          emails.push(email);
        }
      }
    }

    const uniqueEmails = [...new Set(emails)];

    // Check against existing profiles and invitations
    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("email")
      .in("email", uniqueEmails);
    const registeredSet = new Set((existingProfiles || []).map((p: any) => p.email?.toLowerCase()));

    const { data: existingInvites } = await supabase
      .from("trainer_invitations")
      .select("email")
      .in("email", uniqueEmails);
    const invitedSet = new Set((existingInvites || []).map((i: any) => i.email?.toLowerCase()));

    const newEmails = uniqueEmails.filter(e => !registeredSet.has(e) && !invitedSet.has(e));
    const registered = uniqueEmails.filter(e => registeredSet.has(e)).length;
    const duplicate = uniqueEmails.filter(e => invitedSet.has(e) && !registeredSet.has(e)).length;

    setCsvEmails(newEmails);
    setPreviewData({ newEmails, registered, duplicate });
    setShowPreview(true);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendInvitations = async () => {
    if (!csvEmails.length) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-trainer-invitations", {
        body: { action: "send_invitations", emails: csvEmails },
      });
      if (error) throw error;
      toast({
        title: "Invitations Sent!",
        description: `${data.results.sent} invitations sent. ${data.results.skipped_registered} already registered. ${data.results.skipped_duplicate} already invited.`,
        variant: "success",
      });
      setShowPreview(false);
      setCsvEmails([]);
      setPreviewData(null);
      fetchInvitations();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("send-trainer-invitations", {
        body: { action: "resend_invitation", invitationId: id },
      });
      if (error) throw error;
      toast({ title: "Reminder Sent", description: "Reminder email sent successfully.", variant: "success" });
      fetchInvitations();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleSyncSignups = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("send-trainer-invitations", {
        body: { action: "sync_signups" },
      });
      if (error) throw error;
      toast({ title: "Synced", description: `${data.updated} invitation statuses updated.`, variant: "success" });
      fetchInvitations();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleSendAutoReminders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("send-trainer-invitations", {
        body: { action: "send_auto_reminders" },
      });
      if (error) throw error;
      toast({ title: "Auto-Reminders", description: `${data.reminders_sent} reminders sent.`, variant: "success" });
      fetchInvitations();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const rows = [["Email", "Status", "Invited At", "Reminder Sent", "Signed Up At", "Emails Sent"]];
    filtered.forEach(inv => {
      rows.push([
        inv.email,
        inv.status,
        inv.invited_at ? formatDateIST(inv.invited_at) : "",
        inv.reminder_sent_at ? formatDateIST(inv.reminder_sent_at) : "",
        inv.signed_up_at ? formatDateIST(inv.signed_up_at) : "",
        String(inv.emails_sent),
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trainer-invitations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = invitations.filter(inv => {
    if (tab !== "all" && inv.status !== tab) return false;
    if (search) return inv.email.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const counts = {
    all: invitations.length,
    invited: invitations.filter(i => i.status === "invited").length,
    reminder_sent: invitations.filter(i => i.status === "reminder_sent").length,
    signed_up: invitations.filter(i => i.status === "signed_up").length,
  };

  const conversionRate = counts.all > 0 ? ((counts.signed_up / counts.all) * 100).toFixed(1) : "0";

  const statusBadge = (status: string) => {
    switch (status) {
      case "invited": return <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">Invited</span>;
      case "reminder_sent": return <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">Reminder Sent</span>;
      case "signed_up": return <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">Signed Up</span>;
      default: return <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trainer Invitations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Invite trainers via CSV upload and track their status</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleSyncSignups}>
            <RefreshCw className="w-3.5 h-3.5" /> Sync Signups
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleSendAutoReminders}>
            <Clock className="w-3.5 h-3.5" /> Send Auto Reminders
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-foreground">{counts.all}</p><p className="text-xs text-muted-foreground">Total Invited</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><UserPlus className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold text-foreground">{counts.signed_up}</p><p className="text-xs text-muted-foreground">Signed Up</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-foreground">{counts.invited + counts.reminder_sent}</p><p className="text-xs text-muted-foreground">Pending</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{conversionRate}%</p><p className="text-xs text-muted-foreground">Conversion Rate</p></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Upload Section */}
      <Card className="mt-5">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Upload Trainer Emails</h3>
              <p className="text-sm text-muted-foreground mt-1">Upload a CSV file with trainer emails. System will auto-check for existing registrations.</p>
            </div>
            <div>
              <input type="file" accept=".csv,.txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="w-4 h-4" /> Upload CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="invited">Invited ({counts.invited})</TabsTrigger>
            <TabsTrigger value="reminder_sent">Reminder Sent ({counts.reminder_sent})</TabsTrigger>
            <TabsTrigger value="signed_up">Signed Up ({counts.signed_up})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-card rounded-xl border animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No invitations found</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(inv => (
              <div key={inv.id} className="bg-card rounded-xl border p-4 flex items-center justify-between hover:border-primary/20 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="font-medium text-foreground truncate">{inv.email}</p>
                    {statusBadge(inv.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Invited {formatDateIST(inv.invited_at)}
                    {inv.reminder_sent_at && ` • Reminder ${formatDateIST(inv.reminder_sent_at)}`}
                    {inv.signed_up_at && ` • Signed up ${formatDateIST(inv.signed_up_at)}`}
                    {` • ${inv.emails_sent} email${inv.emails_sent > 1 ? "s" : ""} sent`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {inv.status !== "signed_up" && inv.emails_sent < 2 && (
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => handleResend(inv.id)}>
                      <MailPlus className="w-3.5 h-3.5" /> Resend
                    </Button>
                  )}
                  {inv.status === "signed_up" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  {inv.emails_sent >= 2 && inv.status !== "signed_up" && (
                    <span className="text-[10px] text-muted-foreground">Max sent</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Invitations</DialogTitle>
            <DialogDescription>
              Review the email list before sending invitations.
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-700">{previewData.newEmails.length}</p>
                  <p className="text-xs text-emerald-600">New Trainers</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-700">{previewData.registered}</p>
                  <p className="text-xs text-amber-600">Already Registered</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">{previewData.duplicate}</p>
                  <p className="text-xs text-blue-600">Already Invited</p>
                </div>
              </div>
              {previewData.newEmails.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Emails to be invited:</p>
                  {previewData.newEmails.map(email => (
                    <p key={email} className="text-sm text-foreground truncate">{email}</p>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
            <Button onClick={handleSendInvitations} disabled={sending || !previewData?.newEmails.length} className="gap-2">
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send {previewData?.newEmails.length || 0} Invitations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTrainerInvitations;
