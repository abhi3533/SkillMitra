import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Award } from "lucide-react";

const AdminCertificates = () => {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("certificates").select("*").order("issue_date", { ascending: false }).then(({ data }) => {
      setCerts(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
      <div className="mt-6 bg-card rounded-xl border p-6">
        {loading ? <p className="text-muted-foreground">Loading...</p> :
          certs.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground mt-2">No certificates issued yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b">
                <th className="text-left px-4 py-2 text-xs text-muted-foreground">Certificate ID</th>
                <th className="text-left px-4 py-2 text-xs text-muted-foreground">Course</th>
                <th className="text-left px-4 py-2 text-xs text-muted-foreground">Score</th>
                <th className="text-left px-4 py-2 text-xs text-muted-foreground">Date</th>
              </tr></thead>
              <tbody>{certs.map(c => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm font-mono text-foreground">{c.certificate_id}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.course_name || "-"}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{c.overall_score || "-"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.issue_date).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}</tbody>
            </table>
          )
        }
      </div>
    </AdminLayout>
  );
};

export default AdminCertificates;
