import { useState, useEffect, useRef } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { Upload, Send, RefreshCw, Search, Download, MailPlus, CheckCircle, Clock, AlertCircle, Users, UserPlus, TrendingUp, Mail, FileDown, FileSpreadsheet, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
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
  const [previewData, setPreviewData] = useState<{ newEmails: string[]; registered: number; duplicate: number; totalFound: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [singleEmail, setSingleEmail] = useState("");
  const [sendingSingle, setSendingSingle] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Invitation | null>(null);

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

  const extractEmailsFromFile = async (file: File): Promise<string[]> => {
    const emails: string[] = [];
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "xlsx" || ext === "xls") {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        for (const row of rows) {
          for (const cell of row) {
            const val = String(cell || "").trim().toLowerCase();
            if (val && val.includes("@") && !val.startsWith("email")) {
              emails.push(val);
            }
          }
        }
      }
    } else {
      const text = await file.text();
      const lines = text.split(/[\r\n]+/);
      for (const line of lines) {
        const parts = line.split(",");
        for (const part of parts) {
          const email = part.trim().toLowerCase().replace(/^["']|["']$/g, "");
          if (email && email.includes("@") && !email.startsWith("email")) {
            emails.push(email);
          }
        }
      }
    }
    return emails;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rawEmails = await extractEmailsFromFile(file);
      const uniqueEmails = [...new Set(rawEmails)];

      if (uniqueEmails.length === 0) {
        toast({ title: "No emails found", description: "The uploaded file doesn't contain valid email addresses. Please check the format.", variant: "destructive" });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

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
      setPreviewData({ newEmails, registered, duplicate, totalFound: uniqueEmails.length });
      setShowPreview(true);
    } catch (err: any) {
      toast({ title: "File Error", description: "Could not read the file. Please upload a valid CSV or Excel file.", variant: "destructive" });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadSampleCSV = () => {
    const csv = "email\ntrainer1@gmail.com\ntrainer2@gmail.com\ntrainer3@gmail.com";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-trainer-emails.csv";
    a.click();
    URL.revokeObjectURL(url);
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

  const handleSingleEmailInvite = async () => {
    const email = singleEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setSendingSingle(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-trainer-invitations", {
        body: { action: "send_invitations", emails: [email] },
      });
      if (error) throw error;
      if (data.results.sent > 0) {
        toast({ title: "Invitation Sent!", description: `Invitation sent to ${email}`, variant: "success" });
      } else if (data.results.skipped_registered > 0) {
        toast({ title: "Already Registered", description: `${email} is already registered on SkillMitra.`, variant: "destructive" });
      } else if (data.results.skipped_duplicate > 0) {
        toast({ title: "Already Invited", description: `${email} has already been invited.`, variant: "destructive" });
      }
      setSingleEmail("");
      fetchInvitations();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSendingSingle(false);
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

      {/* Single Email Invite */}
      <Card className="mt-5">
        <CardContent className="pt-5 pb-5">
          <h3 className="font-semibold text-foreground mb-1">Invite Single Trainer</h3>
          <p className="text-sm text-muted-foreground mb-3">Enter an email address to send a trainer invitation.</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="trainer@example.com"
              value={singleEmail}
              onChange={e => setSingleEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSingleEmailInvite()}
              className="max-w-md"
            />
            <Button onClick={handleSingleEmailInvite} disabled={sendingSingle || !singleEmail.trim()} className="gap-2 shrink-0">
              {sendingSingle ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload CSV Section */}
      <Card className="mt-3">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" /> Bulk Upload Trainer Emails
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Upload a CSV or Excel (.xlsx, .xls) file with trainer emails. System will auto-check for existing registrations.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadSampleCSV} className="gap-1.5 text-xs">
                <FileDown className="w-3.5 h-3.5" /> Sample CSV
              </Button>
              <input type="file" accept=".csv,.txt,.xlsx,.xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="w-4 h-4" /> Upload File
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
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteTarget(inv); }} title="Delete invitation">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Invitation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the invitation for <strong>{deleteTarget?.email}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              if (!deleteTarget) return;
              const { error } = await supabase.from("trainer_invitations").delete().eq("id", deleteTarget.id);
              if (error) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
              } else {
                toast({ title: "Invitation deleted", description: `Invitation for ${deleteTarget.email} removed.` });
                setInvitations(prev => prev.filter(i => i.id !== deleteTarget.id));
              }
              setDeleteTarget(null);
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{previewData.totalFound}</p>
                  <p className="text-xs text-muted-foreground">Total Found</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-700">{previewData.newEmails.length}</p>
                  <p className="text-xs text-emerald-600">New to Invite</p>
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
                <div className="max-h-48 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Emails to be invited ({previewData.newEmails.length}):</p>
                  <div className="space-y-1">
                    {previewData.newEmails.map((email, i) => (
                      <div key={email} className="flex items-center gap-2 text-sm text-foreground">
                        <span className="text-xs text-muted-foreground w-6 text-right">{i + 1}.</span>
                        <span className="truncate">{email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {previewData.newEmails.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <AlertCircle className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                  All emails are already registered or invited. No new invitations to send.
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
