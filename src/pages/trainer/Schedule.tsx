import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TrainerLayout from "@/components/layouts/TrainerLayout";
import { Calendar } from "lucide-react";

const TrainerSchedule = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single();
      if (!trainer) { setLoading(false); return; }
      const { data } = await supabase.from("course_sessions").select("*").eq("trainer_id", trainer.id).order("scheduled_at", { ascending: true });
      setSessions(data || []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <TrainerLayout>
      <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
      <div className="mt-6">
        {loading ? <p className="text-muted-foreground">Loading...</p> :
          sessions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground mt-2">No sessions scheduled yet</p>
            </div>
          ) : sessions.map(s => (
            <div key={s.id} className="bg-card rounded-xl border p-4 mb-3">
              <p className="font-medium text-foreground">{s.title || `Session #${s.session_number}`}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString("en-IN") : "Not scheduled"} • {s.status}</p>
            </div>
          ))
        }
      </div>
    </TrainerLayout>
  );
};

export default TrainerSchedule;
