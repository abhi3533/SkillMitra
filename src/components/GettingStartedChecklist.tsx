import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Search, Calendar, BookOpen, ChevronDown, ChevronUp, Sparkles, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Step {
  id: string;
  label: string;
  description: string;
  link: string;
  icon: any;
  done: boolean;
}

const GettingStartedChecklist = () => {
  const { user, profile } = useAuth();
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Profile is "enriched" only when extras are added (city + interests).
      // Basic name/phone are captured at signup, so we treat profile as
      // optional polish — not a blocker.
      const { data: student } = await supabase.from("students").select("id, course_interests").eq("user_id", user.id).maybeSingle();
      const profileEnriched = !!(profile?.city && (student?.course_interests?.length ?? 0) > 0);

      let hasEnrollment = false;
      let hasTrial = false;
      if (student) {
        const { count: enrollCount } = await supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("student_id", student.id);
        hasEnrollment = (enrollCount || 0) > 0;
        const { count: trialCount } = await supabase.from("trial_bookings").select("id", { count: "exact", head: true }).eq("student_id", student.id);
        hasTrial = (trialCount || 0) > 0;
      }

      setSteps([
        { id: "browse", label: "Browse Trainers", description: "Find your ideal trainer", link: "/browse", icon: Search, done: true },
        { id: "trial", label: "Book a Free Trial", description: "Try before you enroll", link: "/browse", icon: Calendar, done: hasTrial },
        { id: "enroll", label: "Enroll in a Course", description: "Start your training journey", link: "/browse", icon: BookOpen, done: hasEnrollment },
        { id: "profile", label: "Add Profile Details", description: "Optional — helps us match you better", link: "/student/profile", icon: UserPlus, done: profileEnriched },
      ]);
      setLoading(false);
    })();
  }, [user, profile]);

  if (loading) return null;

  const doneCount = steps.filter(s => s.done).length;
  const allDone = doneCount === steps.length;

  // Hide if all done
  if (allDone) return null;

  const progress = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Getting Started</h3>
            <p className="text-xs text-muted-foreground">{doneCount}/{steps.length} done · profile details are optional</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 space-y-1">
          {steps.map(step => (
            <Link key={step.id} to={step.link}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${step.done ? 'bg-muted/20' : 'hover:bg-muted/40'}`}>
              {step.done
                ? <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                : <Circle className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              <step.icon className={`w-4 h-4 flex-shrink-0 ${step.done ? 'text-muted-foreground/30' : 'text-muted-foreground'}`} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default GettingStartedChecklist;
