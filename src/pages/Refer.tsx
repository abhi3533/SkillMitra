import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Copy, MessageCircle, Share2, Gift, Users, UserPlus, Wallet, Clock, CheckCircle, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const APP_DOMAIN = "skillmitra.online";
const STUDENT_REWARD = 400;
const TRAINER_REWARD = 1200;

interface LeaderboardEntry {
  rank: number;
  name: string;
  count: number;
  earned: number;
}

const ReferPage = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState({ total: 0, earned: 0, pending: 0, walletBalance: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!user && !!role;
  const rewardAmount = role === "trainer" ? TRAINER_REWARD : STUDENT_REWARD;

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      // Load leaderboard (public)
      const { data: refs } = await supabase
        .from("referrals")
        .select("referrer_id, reward_amount, status, students!referrals_referrer_id_fkey(user_id)")
        .eq("status", "paid");

      const referrerMap: Record<string, { count: number; earned: number; userId: string }> = {};
      (refs || []).forEach((r: any) => {
        const id = r.referrer_id;
        if (!referrerMap[id]) referrerMap[id] = { count: 0, earned: 0, userId: r.students?.user_id || "" };
        referrerMap[id].count++;
        referrerMap[id].earned += Number(r.reward_amount || 0);
      });

      const sorted = Object.entries(referrerMap)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

      if (sorted.length > 0) {
        const userIds = sorted.map(([, v]) => v.userId).filter(Boolean);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        const pMap: Record<string, string> = {};
        (profiles || []).forEach(p => { pMap[p.id] = p.full_name?.split(" ")[0] || "Student"; });

        setLeaderboard(sorted.map(([, v], i) => ({
          rank: i + 1,
          name: pMap[v.userId] || "Student",
          count: v.count,
          earned: v.earned,
        })));
      }

      // Load personal referral data for logged-in users
      if (user && role === "student") {
        const [{ data: s }, { data: w }] = await Promise.all([
          supabase.from("students").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
        ]);
        if (s) {
          let code = s.referral_code || "";
          if (!code) {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            code = "SM";
            for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
            await supabase.from("students").update({ referral_code: code }).eq("id", s.id);
          }
          setReferralCode(code);
          const { data: myRefs } = await supabase
            .from("referrals")
            .select("reward_amount, status")
            .eq("referrer_id", s.id);
          const paid = (myRefs || []).filter(r => r.status === "paid");
          const pending = (myRefs || []).filter(r => r.status === "pending" || r.status === "eligible");
          setStats({
            total: (myRefs || []).length,
            earned: paid.reduce((sum, r) => sum + Number(r.reward_amount || 0), 0),
            pending: pending.reduce((sum, r) => sum + Number(r.reward_amount || 0), 0),
            walletBalance: Number(w?.balance || 0),
          });
        }
      } else if (user && role === "trainer") {
        const [{ data: tFull }, { data: w }] = await Promise.all([
          supabase.from("trainers").select("id, referral_code").eq("user_id", user.id).maybeSingle(),
          supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
        ]);
        if (tFull) {
          let code = tFull.referral_code || "";
          if (!code) {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            code = "SM";
            for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
            await supabase.from("trainers").update({ referral_code: code }).eq("id", tFull.id);
          }
          setReferralCode(code);
          const { data: myRefs } = await supabase
            .from("trainer_referrals")
            .select("reward_amount, status")
            .eq("referrer_id", tFull.id);
          const paid = (myRefs || []).filter(r => r.status === "paid");
          const pending = (myRefs || []).filter(r => r.status === "pending" || r.status === "eligible");
          setStats({
            total: (myRefs || []).length,
            earned: paid.reduce((sum, r) => sum + Number(r.reward_amount || 0), 0),
            pending: pending.reduce((sum, r) => sum + Number(r.reward_amount || 0), 0),
            walletBalance: Number(w?.balance || 0),
          });
        }
      }
      setLoading(false);
    };
    load();
  }, [user, role, authLoading]);

  const referralLink = referralCode
    ? role === "trainer"
      ? `https://${APP_DOMAIN}/trainer/signup?ref=${referralCode}`
      : `https://${APP_DOMAIN}/student/signup?ref=${referralCode}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Copied!", description: "Referral link copied to clipboard", variant: "success" });
  };

  const shareWhatsApp = () => {
    const msg = role === "trainer"
      ? `Become a trainer on SkillMitra! 🎓 Use my referral code and earn ₹${TRAINER_REWARD} when you complete your first session.\n\n${referralLink}`
      : `Hey! I use SkillMitra for personal 1:1 skill training. Use my referral code ${referralCode} and we both get ₹${STUDENT_REWARD} credit! Sign up at ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const steps = [
    { icon: Share2, title: "Share Your Link", desc: "Send your unique referral link to friends via WhatsApp, social media, or directly." },
    { icon: UserPlus, title: "Friend Signs Up", desc: "Your friend creates a free SkillMitra account using your referral link." },
    { icon: Gift, title: `Earn ₹${rewardAmount}`, desc: role === "trainer" ? `You get ₹${TRAINER_REWARD} when they complete their first paid session.` : `You both get ₹${STUDENT_REWARD} when they complete their first paid course (₹5,000+).` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Gift className="w-4 h-4" /> Referral Program
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
              Earn <span className="text-primary">₹{rewardAmount}</span> for Every Successful Referral
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto">
              {role === "trainer"
                ? `Refer fellow trainers and earn ₹${TRAINER_REWARD} when they complete their first paid session on SkillMitra.`
                : `Both you and your friend get ₹${STUDENT_REWARD} wallet credit when they complete their first paid course (₹5,000+) on SkillMitra.`
              }
            </p>

            {/* CTA */}
            {isLoggedIn && referralLink ? (
              <div className="mt-8 max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-card border rounded-xl p-2">
                  <div className="flex-1 bg-muted rounded-lg px-4 py-3 text-sm text-foreground font-mono truncate min-w-0">{referralLink}</div>
                  <Button onClick={copyLink} size="icon" variant="outline" className="shrink-0 self-end sm:self-auto"><Copy className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                  <Button onClick={shareWhatsApp} className="gap-2 bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                    <MessageCircle className="w-4 h-4" /> Share on WhatsApp
                  </Button>
                  <Button onClick={copyLink} variant="outline" className="gap-2 w-full sm:w-auto">
                    <Copy className="w-4 h-4" /> Copy Link
                  </Button>
                </div>
              </div>
            ) : !isLoggedIn ? (
              <div className="mt-8">
                <Link to="/student/signup">
                  <Button size="lg" className="gap-2 text-base px-8">
                    Sign Up to Get Your Referral Link <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground text-center mb-12">How It Works</h2>
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start gap-8 sm:gap-0">
            {steps.map((step, i) => (
              <div key={step.title} className="flex-1 flex flex-col items-center text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 relative z-10">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-base">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[calc(50%+32px)] w-[calc(100%-64px)] h-0.5 bg-border z-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats (logged in only) */}
      {isLoggedIn && !loading && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-xl font-bold text-foreground text-center mb-8">Your Referral Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { label: "Total Referrals", value: String(stats.total), icon: Users, color: "text-primary bg-primary/10" },
                { label: "Credits Earned", value: `₹${stats.earned.toLocaleString("en-IN")}`, icon: Gift, color: "text-emerald-600 bg-emerald-50" },
                { label: "Pending Credits", value: `₹${stats.pending.toLocaleString("en-IN")}`, icon: Clock, color: "text-amber-600 bg-amber-50" },
                { label: "Wallet Balance", value: `₹${stats.walletBalance.toLocaleString("en-IN")}`, icon: Wallet, color: "text-primary bg-primary/10" },
              ].map(s => (
                <div key={s.label} className="bg-card rounded-xl border p-5 text-center">
                  <div className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-3`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Leaderboard */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium mb-3">
                <Trophy className="w-4 h-4" /> Top Referrers
              </div>
              <h2 className="text-2xl font-bold text-foreground">Referral Leaderboard</h2>
            </div>
            {leaderboard.length === 0 ? (
              <div className="bg-card rounded-xl border p-8 text-center">
                <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No referrals yet — be the first!</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border overflow-hidden">
                {leaderboard.map((entry, i) => (
                  <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i < leaderboard.length - 1 ? "border-b" : ""} ${i === 0 ? "bg-amber-50/50" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-white" : i === 2 ? "bg-amber-700 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {entry.rank}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">{entry.name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.count} referrals</p>
                    </div>
                    <p className="text-sm font-bold text-foreground">₹{entry.earned.toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">Terms & Conditions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Clock, text: "Credits are valid for 90 days from the date of issuance" },
                { icon: CheckCircle, text: "Student referrals: friend must complete a paid course worth ₹5,000+" },
                { icon: CheckCircle, text: "Trainer referrals: referred trainer must complete their first paid session" },
                { icon: Users, text: "Maximum 50 successful referrals per account" },
                { icon: Wallet, text: "Credits can be used to pay for any course on SkillMitra" },
                { icon: Gift, text: `Students earn ₹${STUDENT_REWARD} per referral, trainers earn ₹${TRAINER_REWARD}` },
              ].map((term, i) => (
                <div key={i} className="flex items-start gap-3 bg-card rounded-xl border p-4">
                  <term.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground">{term.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!isLoggedIn && (
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Start Earning?</h2>
            <p className="text-muted-foreground mb-6">Sign up for free and start sharing your referral link today.</p>
            <Link to="/student/signup">
              <Button size="lg" className="gap-2 px-8">Get Started <ArrowRight className="w-5 h-5" /></Button>
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default ReferPage;
