import { useState, useEffect, useCallback, useMemo } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { Check, X, Eye, Search, RefreshCw, ShieldOff, Trash2, Pencil, Bell, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/layouts/AdminLayout";
import TrainerDetailDrawer from "@/components/admin/TrainerDetailDrawer";
import RejectTrainerModal from "@/components/admin/RejectTrainerModal";
import OnboardingPipeline from "@/components/admin/OnboardingPipeline";
import EditTrainerModal from "@/components/admin/EditTrainerModal";

const AdminTrainers = () => {
  const { toast } = useToast();
  const { role } = useAuth();
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name-asc" | "name-desc" | "status">("newest");
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [suspendTarget, setSuspendTarget] = useState<any>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [removeTarget, setRemoveTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [reminderSending, setReminderSending] = useState<string | null>(null);
  const [reminderSentMap, setReminderSentMap] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem("admin_trainer_reminders");
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  const sendReminder = useCallback(async (trainer: any) => {
    const today = new Date().toISOString().slice(0, 10);
    const lastSent = reminderSentMap[trainer.id];
    if (lastSent === today) {
      toast({ title: "Reminder already sent today", description: "Try again tomorrow.", variant: "warning" });
      return;
    }
    setReminderSending(trainer.id);
    try {
      const { error } = await supabase.functions.invoke("onboarding-reminders", {
        body: { trainer_id: trainer.id, reminder_type: "admin_nudge" },
      });
      if (error) throw error;
      const updated = { ...reminderSentMap, [trainer.id]: today };
      setReminderSentMap(updated);
      localStorage.setItem("admin_trainer_reminders", JSON.stringify(updated));
      toast({ title: "Reminder sent!", description: `Email sent to ${trainer.profiles?.full_name || "trainer"}.`, variant: "success" });
    } catch (err: any) {
      toast({ title: "Failed to send reminder", description: err.message, variant: "destructive" });
    } finally {
      setReminderSending(null);
    }
  }, [reminderSentMap, toast]);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const { data: trainerRows, error: trainerError } = await supabase
        .from("trainers")
        .select("*")
        .order("created_at", { ascending: false });

      if (trainerError) throw trainerError;

      const trainersArr = trainerRows || [];

      if (trainersArr.length === 0) {
        setTrainers([]);
        return;
      }

      const userIds = trainersArr.map((t) => t.user_id).filter(Boolean);
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profileError) throw profileError;

      const profileMap: Record<string, any> = {};
      (profileRows || []).forEach((p) => {
        profileMap[p.id] = p;
      });

      const enriched = trainersArr.map((t) => ({
        ...t,
        profiles: profileMap[t.user_id] || null,
      }));

      setTrainers(enriched);
    } catch (error: any) {
      console.error("Failed to load admin trainers:", error);
      toast({
        title: "Could not load trainers",
        description: error?.message || "Please refresh and try again.",
        variant: "destructive",
      });
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrainers(); }, []);

  // Real-time subscription for trainer status changes
  useEffect(() => {
    const channel = supabase
      .channel('admin-trainers-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trainers' },
        () => { fetchTrainers(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string, rejectionReason?: string) => {
    if (role !== "admin") {
      toast({ title: "Unauthorized", description: "Only admins can perform this action.", variant: "destructive" });
      return;
    }

    // Block approval if onboarding not submitted
    if (status === "approved") {
      const trainer = trainers.find(t => t.id === id);
      const onboardingDone = trainer?.onboarding_status === "pending" || trainer?.onboarding_status === "submitted";
      if (!onboardingDone) {
        toast({
          title: "Cannot Approve",
          description: `Trainer's onboarding is not complete (status: "${trainer?.onboarding_status || "unknown"}"). Ask them to finish their profile first.`,
          variant: "destructive",
        });
        return;
      }
    }

    const update: any = { approval_status: status };
    if (rejectionReason) update.rejection_reason = rejectionReason;

    // Extend: sync profile_status and trainer_status with approval decision
    if (status === "approved") {
      update.profile_status = "approved";
      update.trainer_status = "active";
    } else if (status === "rejected") {
      update.profile_status = "rejected";
      update.trainer_status = "inactive";
    } else if (status === "suspended") {
      update.profile_status = "suspended";
      update.trainer_status = "inactive";
    }

    const { error } = await supabase.from("trainers").update(update).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setTrainers(prev => prev.map(t => t.id === id ? { ...t, ...update } : t));
    setDrawerOpen(false);
    setRejectTarget(null);

    const trainer = trainers.find(t => t.id === id);
    const trainerName = trainer?.profiles?.full_name || "Trainer";

    // Send email notification
    supabase.functions.invoke("notify-trainer-status", {
      body: { trainer_id: id, status, rejection_reason: rejectionReason },
    }).then(({ data, error: fnErr }) => {
      if (fnErr) {
        toast({ title: `Trainer ${status}`, description: "Status updated but email notification failed.", variant: "warning" });
      } else {
        toast({ title: `Trainer ${status}!`, description: `Email notification sent to ${trainerName}.`, variant: "success" });
      }
    });

    // If approved, trigger referral reward for referred trainers
    if (status === "approved" && trainer?.referred_by) {
      supabase.functions.invoke("complete-trainer-referral", {
        body: { trainer_id: id },
      }).then(({ data, error: refErr }) => {
        if (!refErr && data?.success) {
          toast({ title: "Referral Reward", description: `₹${data.reward} credited to referrer's wallet`, variant: "success" });
        }
      });
    }

    // If rejected, mark any pending referral for this trainer as rejected so
    // Trainer A's dashboard doesn't show "Pending Approval" forever.
    // Then notify Trainer A via email + in-app notification.
    if (status === "rejected") {
      supabase
        .from("trainer_referrals")
        .update({ status: "rejected" })
        .eq("referred_id", id)
        .eq("status", "pending")
        .then(({ error: refErr }) => {
          if (refErr) {
            console.error("Failed to reject referral on trainer rejection:", refErr);
            return;
          }
          // Notify the referrer (Trainer A) that their referred trainer was not approved.
          // Fire-and-forget — failure here is non-critical.
          supabase.functions.invoke("notify-referral-rejected", {
            body: { referred_trainer_id: id },
          }).then(({ error: notifErr }) => {
            if (notifErr) console.error("Failed to notify referrer of trainer rejection:", notifErr);
          });
        });
    }

    // Log activity
    supabase.from("admin_activity_log").insert({
      event_type: status === "approved" ? "trainer_approved" : "trainer_rejected",
      title: `Trainer ${status === "approved" ? "Approved" : "Rejected"}`,
      description: `${trainerName} was ${status} by admin${rejectionReason ? ` — Reason: ${rejectionReason}` : ""}`,
      metadata: { trainer_id: id, status },
    });
  };

  const handleRejectClick = (trainer: any) => setRejectTarget(trainer);
  const handleSuspendClick = (trainer: any) => setSuspendTarget(trainer);
  const handleRemoveClick = (trainer: any) => setRemoveTarget(trainer);

  const handleSuspendConfirm = async () => {
    if (!suspendTarget) return;
    if (!suspendReason.trim()) {
      toast({ title: "Reason required", description: "Please enter a reason for suspension.", variant: "warning" });
      return;
    }
    await updateStatus(suspendTarget.id, "suspended", suspendReason.trim());
    setSuspendTarget(null);
    setSuspendReason("");
  };

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    if (role !== "admin") {
      toast({ title: "Unauthorized", description: "Only admins can perform this action.", variant: "destructive" });
      setRemoveTarget(null);
      return;
    }
    const trainerName = removeTarget.profiles?.full_name || "Trainer";
    const trainerId = removeTarget.id;
    const trainerUserId = removeTarget.user_id;
    const { error } = await supabase.from("trainers").delete().eq("id", trainerId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setRemoveTarget(null);
      return;
    }
    // Also delete from auth.users so email can be reused
    if (trainerUserId) {
      const { error: deleteAuthErr } = await supabase.functions.invoke("delete-auth-user", {
        body: { user_id: trainerUserId },
      });
      if (deleteAuthErr) {
        toast({ title: "Error", description: "Trainer record deleted but auth user removal failed. The email address may remain locked.", variant: "destructive" });
        setRemoveTarget(null);
        return;
      }
    }
    setTrainers(prev => prev.filter(t => t.id !== trainerId));
    setDrawerOpen(false);
    setRemoveTarget(null);

    supabase.functions.invoke("notify-trainer-status", {
      body: { trainer_id: trainerId, status: "removed", rejection_reason: "Your account has been removed from the platform." },
    }).then(({ error: fnErr }) => {
      if (fnErr) {
        toast({ title: "Trainer removed", description: "Removed but email notification failed.", variant: "warning" });
      } else {
        toast({ title: "Trainer removed", description: `${trainerName} has been removed and notified.`, variant: "success" });
      }
    });
  };

  const pipelineCount = trainers.filter(t => 
    t.onboarding_status === "draft" || t.onboarding_status === "registered"
  ).length;

  const isPendingReview = (t: any) => t.approval_status === "pending" && (t.onboarding_status === "pending" || t.onboarding_status === "submitted");

  const filtered = useMemo(() => {
    let result = trainers
      .filter(t => {
        if (tab === "pipeline") return false; // pipeline handled separately
        if (tab === "pending") return isPendingReview(t);
        if (tab === "all") return isPendingReview(t) || t.approval_status === "approved" || t.approval_status === "rejected" || t.approval_status === "suspended";
        return t.approval_status === tab;
      })
      .filter(t => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          t.profiles?.full_name?.toLowerCase().includes(q) ||
          t.profiles?.email?.toLowerCase().includes(q) ||
          (t.skills || []).some((s: string) => s.toLowerCase().includes(q))
        );
      });

    // Apply sorting
    switch (sortBy) {
      case "newest":
        result = result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        result = result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "name-asc":
        result = result.sort((a, b) => (a.profiles?.full_name || "").localeCompare(b.profiles?.full_name || ""));
        break;
      case "name-desc":
        result = result.sort((a, b) => (b.profiles?.full_name || "").localeCompare(a.profiles?.full_name || ""));
        break;
      case "status":
        const statusOrder = { pending: 0, approved: 1, suspended: 2, rejected: 3 };
        result = result.sort((a, b) => (statusOrder[a.approval_status as keyof typeof statusOrder] || 0) - (statusOrder[b.approval_status as keyof typeof statusOrder] || 0));
        break;
    }

    return result;
  }, [trainers, tab, search, sortBy]);

  const counts = {
    pending: trainers.filter(t => isPendingReview(t)).length,
    approved: trainers.filter(t => t.approval_status === "approved").length,
    rejected: trainers.filter(t => t.approval_status === "rejected").length,
    suspended: trainers.filter(t => t.approval_status === "suspended").length,
    all: trainers.filter(t => isPendingReview(t) || t.approval_status === "approved" || t.approval_status === "rejected" || t.approval_status === "suspended").length,
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trainer Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review and manage trainer applications</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={fetchTrainers} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="pipeline">
              Pipeline {pipelineCount > 0 && <span className="ml-1 bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full">{pipelineCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="suspended">Suspended ({counts.suspended})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search name, email, skill..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="h-9 w-[160px] text-sm">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        {tab === "pipeline" ? (
          <OnboardingPipeline trainers={trainers} loading={loading} search={search} sortBy={sortBy} onTrainerClick={(t) => { setSelectedTrainer(t); setDrawerOpen(true); }} onDeleteTrainer={(t) => { setTrainers(prev => prev.filter(tr => tr.id !== t.id)); }} />
        ) : loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-card rounded-xl border animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No trainers found</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => (
              <div key={t.id} className="bg-card rounded-xl border p-4 flex items-center justify-between hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => { setSelectedTrainer(t); setDrawerOpen(true); }}>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {t.profiles?.profile_picture_url ? (
                      <img src={t.profiles.profile_picture_url} alt="" className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-primary font-bold text-sm">{t.profiles?.full_name?.[0] || "T"}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{t.profiles?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.profiles?.email}
                      {t.profiles?.phone ? ` • ${t.profiles.phone}` : ""}
                      {t.experience_years ? ` • ${t.experience_years}y exp` : ""}
                      {t.skills?.length ? ` • ${t.skills.slice(0, 3).join(", ")}` : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Applied {formatDateIST(t.created_at)}
                      {t.profiles?.city ? ` • ${t.profiles.city}` : ""}
                      {t.current_company ? ` • ${t.current_role || ""} at ${t.current_company}` : ""}
                    </p>
                    {reminderSentMap[t.id] && (
                      <p className="text-[10px] text-primary mt-0.5">Last reminded: {reminderSentMap[t.id]}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    t.approval_status === "approved" ? "bg-emerald-50 text-emerald-700" :
                    t.approval_status === "suspended" ? "bg-orange-50 text-orange-700" :
                    t.approval_status === "rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-amber-50 text-amber-700"
                  }`}>
                    {t.approval_status}
                  </span>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedTrainer(t); setDrawerOpen(true); }} title="View">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditTarget(t)} title="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                   {t.approval_status === "pending" && (
                    <>
                      <Button size="sm" className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(t.id, "approved")}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleRejectClick(t)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs px-2" onClick={() => sendReminder(t)} disabled={reminderSending === t.id} title="Send reminder email">
                        <Bell className="w-3.5 h-3.5" /> {reminderSending === t.id ? "..." : "Remind"}
                      </Button>
                    </>
                  )}
                  {t.approval_status === "approved" && (
                    <>
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs px-2 border-orange-300 text-orange-700 hover:bg-orange-50" onClick={() => handleSuspendClick(t)}>
                        <ShieldOff className="w-3.5 h-3.5" /> Suspend
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs px-2 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveClick(t)}>
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </Button>
                    </>
                  )}
                  {t.approval_status === "suspended" && (
                    <Button size="sm" className="h-8 gap-1 text-xs px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(t.id, "approved")}>
                      <Check className="w-3.5 h-3.5" /> Reactivate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TrainerDetailDrawer
        trainer={selectedTrainer}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApprove={(id) => updateStatus(id, "approved")}
        onReject={(id) => {
          const t = trainers.find(tr => tr.id === id);
          if (t) handleRejectClick(t);
        }}
        onSuspend={(t) => { setDrawerOpen(false); handleSuspendClick(t); }}
        onRemove={(t) => { setDrawerOpen(false); handleRemoveClick(t); }}
        onEdit={(t) => { setDrawerOpen(false); setEditTarget(t); }}
      />

      <RejectTrainerModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        trainerName={rejectTarget?.profiles?.full_name || "Trainer"}
        onConfirm={(reason) => updateStatus(rejectTarget.id, "rejected", reason)}
      />

      <Dialog open={!!suspendTarget} onOpenChange={() => { setSuspendTarget(null); setSuspendReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Trainer</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend <strong>{suspendTarget?.profiles?.full_name || "this trainer"}</strong>? They will not be able to log in or be visible to students.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Reason for suspension (required)"
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSuspendTarget(null); setSuspendReason(""); }}>Cancel</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSuspendConfirm} disabled={!suspendReason.trim()}>Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Trainer</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{removeTarget?.profiles?.full_name || "this trainer"}</strong>? This action cannot be undone. The trainer will be permanently deleted and notified via email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveConfirm}>Remove Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditTrainerModal
        trainer={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={() => { setEditTarget(null); fetchTrainers(); }}
      />
    </AdminLayout>
  );
};

export default AdminTrainers;
