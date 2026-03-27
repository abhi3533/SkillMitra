import { useState, useEffect } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { Copy, Share2, Gift, Users, Wallet, MessageCircle, Link2, Clock, CheckCircle, XCircle, ShieldCheck, FileText, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StudentLayout from "@/components/layouts/StudentLayout";

const APP_DOMAIN = "skillmitra.online";
const REFERRER_REWARD = 500;
const REFERRED_DISCOUNT = 100;

const StudentReferrals = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const [{ data: s }, { data: w }] = await Promise.all([
          supabase.from("students").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
        ]);
        if (cancelled) return;
        if (s) {
          let code = s.referral_code || "";
          if (!code) {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            code = "SM-";
            for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
            await supabase.from("students").update({ referral_code: code }).eq("id", s.id);
            s.referral_code = code;
          }
          setStudent(s);
          setWalletBalance(Number(w?.balance || 0));

          const { data: refs } = await supabase
            .from("referrals")
            .select("*, referred:referred_id(user_id)")
            .eq("referrer_id", s.id)
            .order("created_at", { ascending: false });

          if (cancelled) return;
          if (refs && refs.length > 0) {
            const userIds = refs.map((r: any) => r.referred?.user_id).filter(Boolean);
            let profileMap: Record<string, any> = {};
            if (userIds.length > 0) {
              const { data: profiles } = await supabase
                .from("profiles")
                .select("id, full_name, created_at")
                .in("id", userIds);
              (profiles || []).forEach(p => { profileMap[p.id] = p; });
            }
            setReferrals(refs.map((r: any) => ({
              ...r,
              referred_name: profileMap[r.referred?.user_id]?.full_name || "Student",
              referred_date: profileMap[r.referred?.user_id]?.created_at || r.created_at,
            })));
          } else {
            setReferrals([]);
          }
        }
      } catch (err) {
        console.error("Referral load error:", err);
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const referralCode = student?.referral_code || "";
  const referralLink = referralCode ? `https://${APP_DOMAIN}/student/signup?ref=${referralCode}` : "";
  const totalPaid = referrals.filter(r => r.status === "paid").length;
  const totalPending = referrals.filter(r => r.status === "pending").length;
  const totalEarned = referrals.filter(r => r.status === "paid").reduce((sum, r) => sum + Number(r.reward_amount || 0), 0);
  const totalPendingAmount = referrals.filter(r => r.status === "pending").reduce((sum, r) => sum + Number(r.reward_amount || 0), 0);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Copied!", description: "Referral code copied", variant: "success" });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Copied!", description: "Referral link copied to clipboard", variant: "success" });
  };

  const shareWhatsApp = () => {
    const msg = `Hey! I use SkillMitra for personal 1:1 skill training. Use my referral code ${referralCode} and get ₹${REFERRED_DISCOUNT} off your first course! Sign up at ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join SkillMitra",
        text: `Use my referral code ${referralCode} and get ₹${REFERRED_DISCOUNT} off your first course!`,
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return { className: "bg-emerald-50 text-emerald-700", label: "Enrolled & Paid", icon: CheckCircle };
      case "eligible":
        return { className: "bg-primary/10 text-primary", label: "Eligible", icon: Clock };
      default:
        return { className: "bg-amber-50 text-amber-700", label: "Pending Enrollment", icon: Clock };
    }
  };

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold text-foreground">Referral Program</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Invite friends and earn ₹{REFERRER_REWARD} per successful referral. Your friend gets ₹{REFERRED_DISCOUNT} off!
      </p>

      {loading ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-44 rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          {/* Referral Code & Link */}
          <div className="mt-6 bg-card rounded-xl border p-4 sm:p-6">
            <h3 className="font-semibold text-foreground mb-1">Your Referral Code</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Share your code — you earn ₹{REFERRER_REWARD} when your friend completes their first paid enrollment. They get ₹{REFERRED_DISCOUNT} off!
            </p>

            {/* Big code display */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-primary/5 border-2 border-dashed border-primary/30 rounded-xl px-6 py-3">
                <span className="text-2xl font-bold font-mono text-primary tracking-widest">{referralCode}</span>
              </div>
              <Button onClick={copyCode} variant="outline" size="icon" className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            {/* Link */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 bg-muted rounded-lg px-3 sm:px-4 py-3 text-xs sm:text-sm text-foreground font-mono truncate overflow-hidden">
                {referralLink || "No code available"}
              </div>
              <Button onClick={copyLink} variant="outline" size="icon" className="shrink-0"><Copy className="w-4 h-4" /></Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mt-6">
            {[
              { label: "Total Referred", value: String(referrals.length), icon: Users, color: "bg-primary/10 text-primary" },
              { label: "Enrolled", value: String(totalPaid), icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
              { label: "Earned", value: `₹${totalEarned.toLocaleString("en-IN")}`, icon: Gift, color: "bg-emerald-50 text-emerald-600" },
              { label: "Pending", value: `₹${totalPendingAmount.toLocaleString("en-IN")}`, icon: Clock, color: "bg-amber-50 text-amber-600" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-xl border p-3 sm:p-4 text-center">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${s.color} flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="text-base sm:text-lg font-bold text-foreground truncate">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Wallet Balance Quick View */}
          <div className="mt-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Wallet Balance</p>
                <p className="text-2xl font-bold text-primary">₹{walletBalance.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.location.href = "/student/wallet"}>
              View Wallet
            </Button>
          </div>

          {/* How it works */}
          <div className="mt-6 bg-card rounded-xl border p-4 sm:p-6">
            <h3 className="font-semibold text-foreground mb-4">How It Works</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
              {[
                { step: "1", title: "Share Your Code", desc: "Send your referral code or link to friends" },
                { step: "2", title: "Friend Signs Up & Enrolls", desc: `They sign up and get ₹${REFERRED_DISCOUNT} off their first course` },
                { step: "3", title: `You Earn ₹${REFERRER_REWARD}`, desc: "You get ₹500 when they complete their first paid enrollment" },
              ].map(s => (
                <div key={s.step} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-0">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 sm:mx-auto sm:mb-3">
                    <span className="text-primary-foreground font-bold">{s.step}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{s.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referred Students */}
          <div className="mt-6 bg-card rounded-xl border p-4 sm:p-6">
            <h3 className="font-semibold text-foreground mb-4">Referred Students ({referrals.length})</h3>
            {referrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">No referrals yet</p>
                <p className="text-xs text-muted-foreground mt-1">Share your code to start earning!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {referrals.map(r => {
                  const badge = getStatusBadge(r.status);
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-xs">{(r.referred_name || "S")[0]}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{r.referred_name || "Student"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateIST(r.referred_date || r.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <p className="text-sm font-semibold text-foreground">₹{r.reward_amount?.toLocaleString("en-IN")}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${badge.className}`}>
                          <badge.icon className="w-3 h-3" /> {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="mt-6 bg-card rounded-xl border p-4 sm:p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" /> Referral Terms & Conditions
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Earn <strong className="text-foreground">₹{REFERRER_REWARD}</strong> per student you refer</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Your friend gets <strong className="text-foreground">₹{REFERRED_DISCOUNT} off</strong> their first course</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Reward credited after friend's <strong className="text-foreground">first paid enrollment</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span><strong className="text-foreground">No expiry</strong> on referral codes — they never expire</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>One reward per unique referred student only</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>You cannot use your own referral code at checkout</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Maximum 50 successful referrals per student</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Wallet balance can be used to pay for courses</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Fair use policy applies — misuse may result in disqualification</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </StudentLayout>
  );
};

export default StudentReferrals;
