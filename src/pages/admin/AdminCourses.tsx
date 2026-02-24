import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import { BookOpen, Check, X } from "lucide-react";

const AdminCourses = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("courses").select("*, trainers(*, profiles(*))").order("created_at", { ascending: false }).then(({ data }) => {
      setCourses(data || []);
      setLoading(false);
    });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("courses").update({ approval_status: status }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setCourses(prev => prev.map(c => c.id === id ? { ...c, approval_status: status } : c));
    toast({ title: `Course ${status}` });
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Course Approvals</h1>
      <div className="mt-6 space-y-3">
        {loading ? <p className="text-muted-foreground">Loading...</p> :
          courses.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-xl border">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground mt-2">No courses submitted yet</p>
            </div>
          ) : courses.map(c => (
            <div key={c.id} className="bg-card rounded-xl border p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.trainers?.profiles?.full_name} • ₹{Number(c.course_fee).toLocaleString("en-IN")} • {c.level}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.approval_status === "approved" ? "bg-success/10 text-success" : c.approval_status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{c.approval_status}</span>
                {c.approval_status === "pending" && <>
                  <Button size="sm" onClick={() => updateStatus(c.id, "approved")} className="bg-success text-white border-0"><Check className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "rejected")}><X className="w-3 h-3" /></Button>
                </>}
              </div>
            </div>
          ))
        }
      </div>
    </AdminLayout>
  );
};

export default AdminCourses;
