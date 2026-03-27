import { useState, useEffect } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { Check, X, Eye, Search, RefreshCw, ShieldOff, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/layouts/AdminLayout";
import TrainerDetailDrawer from "@/components/admin/TrainerDetailDrawer";
import RejectTrainerModal from "@/components/admin/RejectTrainerModal";
import OnboardingPipeline from "@/components/admin/OnboardingPipeline";

const AdminTrainers = () => {
  const { toast } = useToast();
  const { role } = useAuth();
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [suspendTarget, setSuspendTarget] = useState<any>(null);
  const [removeTarget, setRemoveTarget] = useState<any>(null);

  const fetchTrainers = async () => {
    setLoading(true);
    const { data: trainerRows } = await supabase
      .from("trainers")
      .select("*")
      .order("created_at", { ascending: false });
    const trainersArr = trainerRows || [];

    if (trainersArr.length > 0) {
      const userIds = trainersArr.map(t => t.user_id);
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);
      const profileMap: Record<string, any> = {};
      (profileRows || []).forEach(p => { profileMap[p.id] = p; });
      const enriched = trainersArr.map(t => ({ ...t, profiles: profileMap[t.user_id] || null }));
      setTrainers(enriched);
    } else {
      setTrainers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTrainers(); }, []);

  const updateStatus = async (id: string, status: string, rejectionReason?: string) => {
    if (role !== "admin") {
      toast({ title: "Unauthorized", description: "Only admins can perform this action.", variant: "destructive" });
      return;
    }
    const update: any = { approval_status: status };
    if (rejectionReason) update.rejection_reason = rejectionReason;

    // Extend: sync profile_status with approval decision
    if (status === "approved") {
      update.profile_status = "approved";
    } else if (status === "rejected") {
      update.profile_status = "rejected";
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
  };

  const handleRejectClick = (trainer: any) => setRejectTarget(trainer);
  const handleSuspendClick = (trainer: any) => setSuspendTarget(trainer);
  const handleRemoveClick = (trainer: any) => setRemoveTarget(trainer);

  const handleSuspendConfirm = async () => {
    if (!suspendTarget) return;
    await updateStatus(suspendTarget.id, "suspended");
    setSuspendTarget(null);
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
      supabase.functions.invoke("delete-auth-user", {
        body: { user_id: trainerUserId },
      }).catch(err => console.error("Auth user cleanup failed:", err));
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

  const filtered = trainers
    .filter(t => {
      if (tab === "pipeline") return false; // pipeline handled separately
      // Only show trainers who completed onboarding (onboarding_status === "pending" or beyond) in status tabs
      if (tab === "pending") return t.approval_status === "pending" && t.onboarding_status === "pending";
      if (tab === "all") return t.onboarding_status === "pending" || t.approval_status === "approved" || t.approval_status === "rejected" || t.approval_status === "suspended";
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

  const counts = {
    pending: trainers.filter(t => t.approval_status === "pending" && t.onboarding_status === "pending").length,
    approved: trainers.filter(t => t.approval_status === "approved").length,
    rejected: trainers.filter(t => t.approval_status === "rejected").length,
    suspended: trainers.filter(t => t.approval_status === "suspended").length,
    all: trainers.filter(t => t.onboarding_status === "pending" || t.approval_status === "approved" || t.approval_status === "rejected" || t.approval_status === "suspended").length,
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
        {tab !== "pipeline" && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search name, email, skill..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
        )}
      </div>

      <div className="mt-4">
        {tab === "pipeline" ? (
          <OnboardingPipeline trainers={trainers} loading={loading} />
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
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedTrainer(t); setDrawerOpen(true); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {t.approval_status === "pending" && (
                    <>
                      <Button size="sm" className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(t.id, "approved")}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleRejectClick(t)}>
                        <X className="w-3.5 h-3.5" />
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
      />

      <RejectTrainerModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        trainerName={rejectTarget?.profiles?.full_name || "Trainer"}
        onConfirm={(reason) => updateStatus(rejectTarget.id, "rejected", reason)}
      />

      <Dialog open={!!suspendTarget} onOpenChange={() => setSuspendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Trainer</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend <strong>{suspendTarget?.profiles?.full_name || "this trainer"}</strong>? They will not be able to log in or be visible to students.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSuspendConfirm}>Suspend</Button>
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
    </AdminLayout>
  );
};

export default AdminTrainers;
