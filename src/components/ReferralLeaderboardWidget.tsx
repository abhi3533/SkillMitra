import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  currentStudentId?: string;
}

const ReferralLeaderboardWidget = ({ currentStudentId }: Props) => {
  const [top3, setTop3] = useState<{ name: string; count: number; isCurrent: boolean }[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: refs } = await supabase
        .from("referrals")
        .select("referrer_id, students!referrals_referrer_id_fkey(user_id)")
        .eq("status", "paid");

      const countMap: Record<string, { count: number; userId: string }> = {};
      (refs || []).forEach((r: any) => {
        const id = r.referrer_id;
        if (!countMap[id]) countMap[id] = { count: 0, userId: r.students?.user_id || "" };
        countMap[id].count++;
      });

      const sorted = Object.entries(countMap).sort((a, b) => b[1].count - a[1].count);

      if (sorted.length === 0) { setLoading(false); return; }

      // Get my rank
      if (currentStudentId) {
        const idx = sorted.findIndex(([id]) => id === currentStudentId);
        setMyRank(idx >= 0 ? idx + 1 : null);
      }

      const top = sorted.slice(0, 3);
      const userIds = top.map(([, v]) => v.userId).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      const pMap: Record<string, string> = {};
      (profiles || []).forEach(p => { pMap[p.id] = p.full_name?.split(" ")[0] || "Student"; });

      setTop3(top.map(([id, v]) => ({
        name: pMap[v.userId] || "Student",
        count: v.count,
        isCurrent: id === currentStudentId,
      })));
      setLoading(false);
    })();
  }, [currentStudentId]);

  if (loading || top3.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-card rounded-xl border mt-6">
      <div className="flex items-center justify-between p-5 pb-3">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Referral Leaderboard
        </h2>
        <Link to="/refer" className="text-xs text-primary font-medium hover:underline">View All</Link>
      </div>
      <div className="px-5 pb-5 space-y-2">
        {top3.map((entry, i) => (
          <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${entry.isCurrent ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/30"}`}>
            <span className="text-lg">{medals[i]}</span>
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-xs">{entry.name[0]}</span>
            </div>
            <p className="text-sm font-medium text-foreground flex-1">{entry.name} {entry.isCurrent && <span className="text-xs text-primary">(You)</span>}</p>
            <p className="text-xs text-muted-foreground">{entry.count} referrals</p>
          </div>
        ))}
        {myRank && myRank > 3 && (
          <p className="text-xs text-muted-foreground text-center pt-1">Your rank: #{myRank}</p>
        )}
      </div>
    </div>
  );
};

export default ReferralLeaderboardWidget;
