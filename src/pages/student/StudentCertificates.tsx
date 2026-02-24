import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Award } from "lucide-react";

const StudentCertificates = () => {
  const { user } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (!student) { setLoading(false); return; }
      const { data } = await supabase.from("certificates").select("*").eq("student_id", student.id).order("issue_date", { ascending: false });
      setCerts(data || []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
      <div className="mt-6">
        {loading ? <p className="text-muted-foreground">Loading...</p> :
          certs.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border">
              <Award className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground mt-2">No certificates earned yet</p>
              <p className="text-sm text-muted-foreground mt-1">Complete a course to earn your first certificate</p>
            </div>
          ) : certs.map(c => (
            <div key={c.id} className="bg-card rounded-xl border p-4 mb-3">
              <p className="font-medium text-foreground">{c.course_name}</p>
              <p className="text-xs text-muted-foreground mt-1">ID: {c.certificate_id} • Score: {c.overall_score}</p>
            </div>
          ))
        }
      </div>
    </StudentLayout>
  );
};

export default StudentCertificates;
