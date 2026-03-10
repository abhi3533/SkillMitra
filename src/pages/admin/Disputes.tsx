import { useState, useEffect } from "react";
// No date display changes needed here
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layouts/AdminLayout";
import { AlertTriangle } from "lucide-react";

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("disputes").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setDisputes(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Disputes</h1>
      <div className="mt-6 bg-card rounded-xl border p-6">
        {loading ? <p className="text-muted-foreground">Loading...</p> :
          disputes.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground mt-2">No disputes raised yet</p>
            </div>
          ) : disputes.map(d => (
            <div key={d.id} className="p-4 border-b last:border-0">
              <p className="font-medium text-foreground">{d.subject}</p>
              <p className="text-sm text-muted-foreground mt-1">{d.description}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${d.status === "open" ? "bg-accent/10 text-accent" : "bg-success/10 text-success"}`}>{d.status}</span>
            </div>
          ))
        }
      </div>
    </AdminLayout>
  );
};

export default AdminDisputes;
