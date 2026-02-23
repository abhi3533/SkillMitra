import { useState, useEffect } from "react";
import { Copy, Share2, Gift, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StudentLayout from "@/components/layouts/StudentLayout";

const StudentReferrals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: s } = await supabase.from("students").select("*").eq("user_id", user.id).single();
      setStudent(s);
      if (s) {
        const { data: refs } = await supabase.from("referrals").select("*").eq("referrer_id", s.id);
        setReferrals(refs || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const referralLink = student?.referral_code ? `${window.location.origin}/student/signup?ref=${student.referral_code}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=Join%20SkillMitra%20and%20learn%20from%20India's%20best%20trainers!%20${encodeURIComponent(referralLink)}`, "_blank");
  };

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold text-foreground">Referrals</h1>
      <p className="mt-1 text-muted-foreground">Share SkillMitra and earn rewards</p>

      {/* Referral Link */}
      <div className="mt-6 bg-card rounded-xl border p-6">
        <h3 className="font-semibold text-foreground mb-3">Your Referral Link</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-secondary rounded-lg px-4 py-3 text-sm text-foreground font-mono truncate">
            {referralLink || "Loading..."}
          </div>
          <Button onClick={copyLink} variant="outline" size="icon"><Copy className="w-4 h-4" /></Button>
          <Button onClick={shareWhatsApp} className="hero-gradient border-0" size="icon"><Share2 className="w-4 h-4" /></Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Your code: <span className="font-bold text-foreground">{student?.referral_code || "..."}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { label: "Total Referred", value: referrals.length, icon: Users, color: "hero-gradient" },
          { label: "Credits Earned", value: `₹${referrals.filter(r => r.status === "credited").length * 200}`, icon: Gift, color: "gold-gradient" },
          { label: "Available Credits", value: `₹${student?.referral_credits || 0}`, icon: CreditCard, color: "bg-success" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border p-5 text-center">
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mx-auto mb-2`}>
              <s.icon className="w-5 h-5 text-primary-foreground" />
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
            { step: "2", title: "Friend Signs Up", desc: "Your friend creates an account using your referral link" },
            { step: "3", title: "Both Get Rewards", desc: "You get ₹200 credit, your friend gets ₹100 off their first course" },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="w-10 h-10 rounded-full hero-gradient flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-foreground font-bold">{s.step}</span>
              </div>
              <h4 className="font-semibold text-foreground text-sm">{s.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral History */}
      {referrals.length > 0 && (
        <div className="mt-6 bg-card rounded-xl border p-6">
          <h3 className="font-semibold text-foreground mb-4">Referral History</h3>
          <div className="space-y-2">
            {referrals.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div>
                  <p className="text-sm font-medium text-foreground">Referred User</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">₹{r.reward_amount}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "credited" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default StudentReferrals;
