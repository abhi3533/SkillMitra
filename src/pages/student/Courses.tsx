import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/layouts/StudentLayout";

const StudentCourses = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchEnrollments = async () => {
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (!student) { setLoading(false); return; }
      const { data } = await supabase
        .from("enrollments")
        .select("*, courses(*), trainers(*, profiles(*))")
        .eq("student_id", student.id);
      setEnrollments(data || []);
      setLoading(false);
    };
    fetchEnrollments();
  }, [user]);

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
      <p className="mt-1 text-muted-foreground">All your enrolled courses</p>

      {loading ? (
        <div className="grid gap-4 mt-6">
          {[1, 2].map(i => <div key={i} className="bg-card rounded-xl border p-6 animate-pulse h-40" />)}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="mt-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No Courses Yet</h3>
          <p className="mt-2 text-muted-foreground">You have no courses yet. Browse trainers to enrol in your first course.</p>
          <Link to="/browse"><Button className="mt-4 hero-gradient border-0">Browse Trainers</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 mt-6">
          {enrollments.map(e => (
            <div key={e.id} className="bg-card rounded-xl border p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl hero-gradient flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold">{e.courses?.title?.[0] || "C"}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{e.courses?.title || "Course"}</h3>
                  <p className="text-sm text-muted-foreground">Trainer: {e.trainers?.profiles?.full_name || "Trainer"}</p>
                  <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full hero-gradient rounded-full" style={{ width: `${e.progress_percent || 0}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">{e.progress_percent || 0}% complete • {e.sessions_completed || 0}/{e.sessions_total || 0} sessions</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs"><FileText className="w-3 h-3 mr-1" />Materials</Button>
                      <Button size="sm" className="hero-gradient border-0 text-xs"><Video className="w-3 h-3 mr-1" />Join Session</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
};

export default StudentCourses;
