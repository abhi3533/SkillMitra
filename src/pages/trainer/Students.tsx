import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import TrainerLayout from "@/components/layouts/TrainerLayout";

const TrainerStudents = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single();
      if (trainer) {
        const { data } = await supabase.from("enrollments").select("*, students(*, profiles(*)), courses(title)").eq("trainer_id", trainer.id);
        setEnrollments(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <TrainerLayout>
      <h1 className="text-2xl font-bold text-foreground">My Students</h1>
      <p className="mt-1 text-muted-foreground">All students enrolled in your courses</p>

      {loading ? (
        <div className="mt-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-card rounded-xl border animate-pulse" />)}</div>
      ) : enrollments.length === 0 ? (
        <div className="mt-12 text-center">
          <Users className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No students yet</h3>
          <p className="mt-2 text-muted-foreground">Students will appear here once they enroll in your courses</p>
        </div>
      ) : (
        <div className="mt-6 bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Course</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Progress</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Sessions</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              </tr></thead>
              <tbody>
                {enrollments.map(e => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full hero-gradient flex items-center justify-center">
                          <span className="text-primary-foreground text-xs font-bold">{e.students?.profiles?.full_name?.[0] || "S"}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{e.students?.profiles?.full_name || "Student"}</p>
                          <p className="text-xs text-muted-foreground">{e.students?.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{e.courses?.title}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full hero-gradient rounded-full" style={{ width: `${e.progress_percent || 0}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{e.progress_percent || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{e.sessions_completed || 0}/{e.sessions_total || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${e.status === "active" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </TrainerLayout>
  );
};

export default TrainerStudents;
