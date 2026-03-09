import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Flag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  trainerId: string;
}

interface StudentProgress {
  studentId: string;
  studentName: string;
  email: string;
  courseName: string;
  latestConfidence: number;
  previousConfidence: number | null;
  lastReflection: string;
  reflectionCount: number;
  needsAttention: boolean;
  enrollmentId: string;
}

const TrainerStudentProgress = ({ trainerId }: Props) => {
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Get all enrollments for this trainer
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("id, student_id, courses(title), students(id, user_id)")
        .eq("trainer_id", trainerId)
        .eq("status", "active");

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const studentIds = enrollments.map(e => (e.students as any)?.id).filter(Boolean);
      
      // Get reflections for all students
      const { data: reflections } = await supabase
        .from("session_reflections")
        .select("*")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false });

      // Get profiles
      const userIds = enrollments.map(e => (e.students as any)?.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });

      const items: StudentProgress[] = enrollments.map(e => {
        const student = e.students as any;
        const profile = profileMap[student?.user_id] || {};
        const studentRefs = (reflections || []).filter(r => r.student_id === student?.id);
        const latest = studentRefs[0];
        const previous = studentRefs[1];

        return {
          studentId: student?.id,
          studentName: profile.full_name || "Student",
          email: profile.email || "",
          courseName: (e.courses as any)?.title || "Course",
          latestConfidence: latest?.confidence_level || 0,
          previousConfidence: previous?.confidence_level ?? null,
          lastReflection: latest?.learned_today || "No reflections yet",
          reflectionCount: studentRefs.length,
          needsAttention: latest ? latest.confidence_level <= 2 : false,
          enrollmentId: e.id,
        };
      });

      setProgress(items);
      setLoading(false);
    })();
  }, [trainerId]);

  const getTrend = (current: number, previous: number | null) => {
    if (previous === null || current === 0) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (current > previous) return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const handleFlag = (name: string) => {
    toast({ title: `${name} flagged for extra attention`, variant: "info" });
  };

  if (loading) return <div className="space-y-2 mt-4">{[1, 2].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>;

  if (progress.length === 0) {
    return (
      <div className="text-center py-8 bg-card rounded-xl border mt-4">
        <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto" />
        <p className="text-sm text-muted-foreground mt-2">No student progress data yet</p>
        <p className="text-xs text-muted-foreground mt-1">Reflections will appear after students complete sessions</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {progress.map(p => (
        <div key={`${p.studentId}-${p.enrollmentId}`} className={`bg-card rounded-xl border p-4 ${p.needsAttention ? "border-amber-300 bg-amber-50/30" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{p.studentName[0]}</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground truncate">{p.studentName}</h3>
                  {p.needsAttention && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{p.courseName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Confidence + Trend */}
              <div className="flex items-center gap-1.5">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{p.latestConfidence || "—"}<span className="text-xs text-muted-foreground">/5</span></p>
                  <p className="text-[9px] text-muted-foreground">Confidence</p>
                </div>
                {getTrend(p.latestConfidence, p.previousConfidence)}
              </div>

              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleFlag(p.studentName)}>
                <Flag className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Latest reflection summary */}
          <div className="mt-3 pl-[52px]">
            <p className="text-xs text-muted-foreground line-clamp-2 italic">"{p.lastReflection}"</p>
            <div className="flex items-center gap-3 mt-1.5">
              <Badge variant="outline" className="text-[10px]">{p.reflectionCount} reflections</Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrainerStudentProgress;
