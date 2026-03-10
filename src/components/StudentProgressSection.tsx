import { useState, useEffect } from "react";
import { TrendingUp, Brain, FileText, Flame } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  studentId: string;
}

const StudentProgressSection = ({ studentId }: Props) => {
  const [reflections, setReflections] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("session_reflections")
        .select("*, course_sessions(scheduled_at, session_number)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: true });

      const refs = data || [];
      setReflections(refs);

      // Calculate streak (consecutive weeks with reflections)
      if (refs.length > 0) {
        const weekSet = new Set<string>();
        refs.forEach(r => {
          const d = new Date(r.created_at);
          const year = d.getFullYear();
          const week = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
          weekSet.add(`${year}-W${week}`);
        });
        const weeks = Array.from(weekSet).sort().reverse();
        let s = 1;
        for (let i = 1; i < weeks.length; i++) {
          const [y1, w1] = weeks[i - 1].split("-W").map(Number);
          const [y2, w2] = weeks[i].split("-W").map(Number);
          if ((y1 === y2 && w1 - w2 === 1) || (y1 - y2 === 1 && w2 === 52 && w1 === 1)) {
            s++;
          } else break;
        }
        setStreak(s);
      }
      setLoading(false);
    })();
  }, [studentId]);

  if (loading) return null;
  if (reflections.length === 0) return null;

  const chartData = reflections.map((r, i) => ({
    session: `S${r.course_sessions?.session_number || i + 1}`,
    confidence: r.confidence_level,
    date: formatShortDateIST(r.created_at),
  }));

  const avgConfidence = reflections.length > 0
    ? (reflections.reduce((s, r) => s + r.confidence_level, 0) / reflections.length).toFixed(1)
    : "0";

  return (
    <div className="bg-card rounded-xl border mt-6">
      <div className="p-5 pb-3">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Learning Progress
        </h2>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 px-5">
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <Brain className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{avgConfidence}</p>
          <p className="text-[10px] text-muted-foreground">Avg Confidence</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <FileText className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{reflections.length}</p>
          <p className="text-[10px] text-muted-foreground">Session Notes</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{streak}w</p>
          <p className="text-[10px] text-muted-foreground">Week Streak</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length >= 2 && (
        <div className="px-5 pb-5 pt-4">
          <p className="text-xs text-muted-foreground mb-2">Confidence Over Sessions</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="session" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-card border rounded-lg p-2 shadow-md text-xs">
                      <p className="font-medium text-foreground">{d.session} — {d.date}</p>
                      <p className="text-muted-foreground">Confidence: {d.confidence}/5</p>
                    </div>
                  );
                }}
              />
              <Line type="monotone" dataKey="confidence" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default StudentProgressSection;
