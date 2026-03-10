import { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layouts/AdminLayout";
import { formatDateIST } from "@/lib/dateUtils";

const AdminPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("payments").select("*, students(*, profiles(full_name)), enrollments(*, courses(title))").order("created_at", { ascending: false });
      setPayments(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Payments</h1>
      <p className="mt-1 text-muted-foreground">All payment transactions</p>

      <div className="mt-6 bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-secondary/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Student</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Course</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center">
                  <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground mt-2">No payments yet</p>
                </td></tr>
              ) : payments.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-secondary/20">
                  <td className="px-4 py-3 text-sm text-foreground">{p.students?.profiles?.full_name || "-"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.enrollments?.courses?.title || "-"}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">₹{Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "completed" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateIST(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
