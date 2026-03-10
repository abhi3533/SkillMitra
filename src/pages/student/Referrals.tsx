import { useState, useEffect } from "react";
import { Copy, Share2, Gift, Users, Wallet, MessageCircle, Link2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StudentLayout from "@/components/layouts/StudentLayout";

const APP_DOMAIN = "skillmitra.online";

const StudentReferrals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: s }, { data: w }] = await Promise.all([
        supabase.from("students").select("*").eq("user_id", user.id).single(),
        supabase.from("wallets").select("balance").eq("user_id", user.id).single(),
      ]);
      setStudent(s);
      setWalletBalance(Number(w?.balance || 0));
      if (s) {
        const { data: refs } = await supabase
          .from("referrals")
          .select("*, referred:referred_id(user_id)")
          .eq("referrer_id", s.id)
          .order("created_at", { ascending: false });

        // Fetch referred student names
        if (refs && refs.length > 0) {
          const userIds = refs.map((r: any) => r.referred?.user_id).filter(Boolean);
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, full_name, created_at")
              .in("id", userIds);
            const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
            const enriched = refs.map((r: any) => ({
              ...r,
              referred_name: profileMap[r.referred?.user_id]?.full_name || "Student",
              referred_date: profileMap[r.referred?.user_id]?.created_at || r.created_at,
            }));
            setReferrals(enriched);
          } else {
            setReferrals(refs || []);
          }
        } else {
          setReferrals([]);
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const referralCode = student?.referral_code || "";
  const referralLink = referralCode ? `https://${APP_DOMAIN}/student/signup?ref=${referralCode}` : "";
  const totalEarned = referrals.filter(r => r.status === "paid").reduce((sum, r) => sum + Number(r.reward_amount || 0), 0);
  const totalPending = referrals.filter(r => r.status === "pending").reduce((sum, r) => sum + Number(r.reward_amount || 0), 0);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Copied!", description: "Referral link copied to clipboard", variant: "success" });
  };

  const shareWhatsApp = () => {
    const msg = `Hey! I use SkillMitra for personal 1:1 skill training. Use my referral code ${referralCode} and we both get ₹200 credit! Sign up at ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join SkillMitra",
        text: `Use my referral code ${referralCode} and we both get ₹200!`,
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold text-foreground">Referral Program</h1>
      <p className="mt-1 text-sm text-muted-foreground">Invite friends and earn ₹200 for each signup</p>

      {loading ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Referral Link Card */}
          <div className="mt-6 bg-card rounded-xl border p-6">
            <h3 className="font-semibold text-foreground mb-1">Your Referral Link</h3>
            <p className="text-xs text-muted-foreground mb-3">Share this link — when someone signs up, you both get ₹200 wallet credit</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-lg px-4 py-3 text-sm text-foreground font-mono truncate">
                {referralLink || "No code available"}
              </div>
              <Button onClick={copyLink} variant="outline" size="icon" title="Copy link">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your code: <span className="font-bold text-foreground font-mono">{referralCode}</span>
            </p>

            {/* Share buttons */}
            <div className="flex gap-2 mt-4">
              <Button onClick={shareWhatsApp} size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-sm">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </Button>
              <Button onClick={copyLink} size="sm" variant="outline" className="gap-1.5 text-sm">
                <Link2 className="w-3.5 h-3.5" /> Copy Link
              </Button>
              <Button onClick={shareNative} size="sm" variant="outline" className="gap-1.5 text-sm">
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total Referred", value: String(referrals.length), icon: Users, color: "bg-primary/10 text-primary" },
              { label: "Pending", value: String(referrals.filter(r => r.status === "pending").length), icon: Clock, color: "bg-amber-50 text-amber-600" },
              { label: "Rewards Earned", value: `₹${totalEarned.toLocaleString("en-IN")}`, icon: Gift, color: "bg-emerald-50 text-emerald-600" },
              { label: "Wallet Balance", value: `₹${walletBalance.toLocaleString("en-IN")}`, icon: Wallet, color: "bg-primary/10 text-primary" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-xl border p-4 text-center">
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="mt-6 bg-card rounded-xl border p-6">
            <h3 className="font-semibold text-foreground mb-4">How It Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: "1", title: "Share Your Link", desc: "Send your referral link to friends via WhatsApp or social media" },
                { step: "2", title: "Friend Signs Up", desc: "Your friend creates a student account using your referral link" },
                { step: "3", title: "Both Get ₹200", desc: "Both you and your friend receive ₹200 wallet credit instantly" },
              ].map(s => (
                <div key={s.step} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary-foreground font-bold">{s.step}</span>
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">{s.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Referred Students */}
          <div className="mt-6 bg-card rounded-xl border p-6">
            <h3 className="font-semibold text-foreground mb-4">Referred Students</h3>
            {referrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No referrals yet</p>
                <p className="text-xs text-muted-foreground mt-1">Share your link to start earning!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {referrals.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-xs">{(r.referred_name || "S")[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.referred_name || "Student"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateIST(r.referred_date || r.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">₹{r.reward_amount}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        r.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </StudentLayout>
  );
};

export default StudentReferrals;
