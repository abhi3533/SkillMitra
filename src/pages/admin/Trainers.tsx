import { useState, useEffect } from "react";
import { Check, X, Eye, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import TrainerDetailDrawer from "@/components/admin/TrainerDetailDrawer";
import RejectTrainerModal from "@/components/admin/RejectTrainerModal";

const AdminTrainers = () => {
  const { toast } = useToast();
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<any>(null);

  const fetchTrainers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("trainers")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false });
    setTrainers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTrainers(); }, []);

  const updateStatus = async (id: string, status: string, rejectionReason?: string) => {
    const update: any = { approval_status: status };
    if (rejectionReason) update.rejection_reason = rejectionReason;
    const { error } = await supabase.from("trainers").update(update).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setTrainers(prev => prev.map(t => t.id === id ? { ...t, ...update } : t));
    setDrawerOpen(false);
    setRejectTarget(null);
    toast({ title: `Trainer ${status}!`, description: status === "approved" ? "The trainer can now create courses." : "The trainer has been notified." });

    // Send email notification via send-email (fire-and-forget)
    const trainer = trainers.find(t => t.id === id);
    const trainerEmail = trainer?.profiles?.email;
    const trainerName = trainer?.profiles?.full_name || "Trainer";
    if (trainerEmail) {
      supabase.functions.invoke("send-email", {
        body: {
          type: status === "approved" ? "trainer_approved" : "trainer_rejected",
          to: trainerEmail,
          data: { name: trainerName, reason: rejectionReason },
        },
      }).then(({ error: fnErr }) => { if (fnErr) console.error("Email error:", fnErr); });
    }

    // Also create in-app notification via old function (fire-and-forget)
    supabase.functions.invoke("notify-trainer-status", {
      body: { trainer_id: id, status, rejection_reason: rejectionReason },
    }).then(({ error: fnErr }) => {
      if (fnErr) console.error("Notification error:", fnErr);
    });
  };

  const handleRejectClick = (trainer: any) => {
    setRejectTarget(trainer);
  };

  const filtered = trainers
    .filter(t => tab === "all" || t.approval_status === tab)
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
    pending: trainers.filter(t => t.approval_status === "pending").length,
    approved: trainers.filter(t => t.approval_status === "approved").length,
    rejected: trainers.filter(t => t.approval_status === "rejected").length,
    all: trainers.length,
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
          <TabsList>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, email, skill..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
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
                      {t.experience_years ? ` • ${t.experience_years}y exp` : ""}
                      {t.skills?.length ? ` • ${t.skills.slice(0, 3).join(", ")}` : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Applied {new Date(t.created_at).toLocaleDateString("en-IN")}
                      {t.current_company ? ` • ${t.current_role || ""} at ${t.current_company}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    t.approval_status === "approved" ? "bg-emerald-50 text-emerald-700" :
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
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

      {/* Reject Modal */}
      <RejectTrainerModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        trainerName={rejectTarget?.profiles?.full_name || "Trainer"}
        onConfirm={(reason) => updateStatus(rejectTarget.id, "rejected", reason)}
      />
    </AdminLayout>
  );
};

export default AdminTrainers;
