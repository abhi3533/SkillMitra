import { useState, useEffect } from "react";
import { Check, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminTrainers = () => {
  const { toast } = useToast();
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("trainers").select("*, profiles(*)").order("created_at", { ascending: false });
      setTrainers(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("trainers").update({ approval_status: status }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setTrainers(prev => prev.map(t => t.id === id ? { ...t, approval_status: status } : t));
    toast({ title: `Trainer ${status}!` });
  };

  const filtered = trainers.filter(t => tab === "all" || t.approval_status === tab);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Trainer Management</h1>
      <p className="mt-1 text-muted-foreground">Review and manage trainer applications</p>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList><TabsTrigger value="pending">Pending ({trainers.filter(t => t.approval_status === "pending").length})</TabsTrigger><TabsTrigger value="approved">Approved</TabsTrigger><TabsTrigger value="rejected">Rejected</TabsTrigger><TabsTrigger value="all">All</TabsTrigger></TabsList>

        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-card rounded-xl border animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No trainers found</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(t => (
                <div key={t.id} className="bg-card rounded-xl border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full hero-gradient flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">{t.profiles?.full_name?.[0] || "T"}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t.profiles?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{t.profiles?.email} • {(t.skills || []).slice(0, 3).join(", ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.approval_status === "approved" ? "bg-success/10 text-success" : t.approval_status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                      {t.approval_status}
                    </span>
                    {t.approval_status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(t.id, "approved")} className="bg-success text-success-foreground border-0"><Check className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, "rejected")}><X className="w-3 h-3" /></Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminTrainers;
