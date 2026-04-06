import { useState, useEffect } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { Copy, Share2, Gift, Users, Wallet, MessageCircle, Link2, Clock, CheckCircle, XCircle, ShieldCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TrainerLayout from "@/components/layouts/TrainerLayout";

const APP_DOMAIN = "skillmitra.online";
const REWARD_AMOUNT = 1500;

const TrainerReferrals = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [trainer, setTrainer] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const [{ data: t }, { data: w }] = await Promise.all([
        supabase.from("trainers").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
      ]);
      if (t) {
        let code = t.referral_code || "";
        if (!code) {
          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          code = "TM-";
          for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
          await supabase.from("trainers").update({ referral_code: code }).eq("id", t.id);
          t.referral_code = code;
        }
      }
      setTrainer(t);
      setWalletBalance(Number(w?.balance || 0));
      if (t) {
        const { data: refs } = await supabase
          .from("trainer_referrals")
          .select("*, referred:referred_id(user_id, approval_status)")
          .eq("referrer_id", t.id)
          .order("created_at", { ascending: false });

        if (refs && refs.length > 0) {
          const userIds = refs.map((r: any) => r.referred?.user_id).filter(Boolean);
          let profileMap: Record<string, any> = {};
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, full_name, email, created_at, profile_picture_url")
              .in("id", userIds);
            (profiles || []).forEach(p => { profileMap[p.id] = p; });
          }
          setReferrals(refs.map((r: any) => ({
            ...r,
            referred_name: profileMap[r.referred?.user_id]?.full_name || "Trainer",
            referred_email: profileMap[r.referred?.user_id]?.email || "",
            referred_date: profileMap[r.referred?.user_id]?.created_at || r.created_at,
            approval_status: r.referred?.approval_status || "pending",
          })));
        } else {
          setReferrals([]);
        }
      }
      setLoading(false);
    };
    load();
  }, [user, authLoading]);

  const referralCode = trainer?.referral_code || "";
  const referralLink = referralCode ? `https://${APP_DOMAIN}/trainer/signup?ref=${referralCode}` : "";
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
    const msg = `Become a trainer on SkillMitra! 🎓 Use my referral code ${referralCode} and earn ₹${REWARD_AMOUNT} when you get approved.\n\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Join SkillMitra as Trainer", text: `Use my referral code ${referralCode}`, url: referralLink });
    } else {
      copyLink();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return { className: "bg-emerald-50 text-emerald-700", label: "Approved & Paid", icon: CheckCircle };
      case "rejected":
        return { className: "bg-destructive/10 text-destructive", label: "Rejected", icon: XCircle };
      default:
        return { className: "bg-amber-50 text-amber-700", label: "Pending Approval", icon: Clock };
    }
  };

  return (
    <TrainerLayout>
      <h1 className="text-2xl font-bold text-foreground">Trainer Referral Program</h1>
      <p className="mt-1 text-sm text-muted-foreground">Invite trainers and earn ₹{REWARD_AMOUNT} per approved referral</p>

      {loading ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          {/* Referral Code & Link */}
          <div className="mt-6 bg-card rounded-xl border p-4 sm:p-6">
            <h3 className="font-semibold text-foreground mb-1">Your Referral Code</h3>
            <p className="text-xs text-muted-foreground mb-4">Share your code or link. Earn ₹{REWARD_AMOUNT} when referred trainer gets admin approved.</p>

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
              { label: "Approved", value: String(totalPaid), icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
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

          {/* How it works */}
          <div className="mt-6 bg-card rounded-xl border p-4 sm:p-6">
            <h3 className="font-semibold text-foreground mb-4">How It Works</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
              {[
                { step: "1", title: "Share Your Code", desc: "Send your referral code/link to fellow professionals" },
                { step: "2", title: "They Sign Up & Complete Profile", desc: "Referred trainer creates account and completes onboarding" },
                { step: "3", title: `Earn ₹${REWARD_AMOUNT}`, desc: "You earn ₹1,500 when they get admin approved" },
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

          {/* Referred Trainers */}
          <div className="mt-6 bg-card rounded-xl border p-4 sm:p-6">
            <h3 className="font-semibold text-foreground mb-4">Referred Trainers ({referrals.length})</h3>
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
                          <span className="text-primary font-bold text-xs">{(r.referred_name || "T")[0]}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{r.referred_name || "Trainer"}</p>
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
                <span>Earn <strong className="text-foreground">₹{REWARD_AMOUNT.toLocaleString("en-IN")}</strong> per trainer you refer</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Referred trainer must complete their profile and get <strong className="text-foreground">admin approved</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span><strong className="text-foreground">No expiry</strong> on referral codes — they never expire</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>One reward per unique referred trainer only</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>You cannot use your own referral code</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Maximum 50 successful referrals per trainer</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Fair use policy applies — misuse may result in disqualification</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </TrainerLayout>
  );
};

export default TrainerReferrals;
