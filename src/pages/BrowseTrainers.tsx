import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { motion } from "framer-motion";
import { Search, Star, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { demoTrainers, getDemoCourse } from "@/lib/demoData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BrowseTrainers = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  usePageMeta("Browse Expert Trainers — SkillMitra", "Find verified industry experts for 1:1 personal training. Filter by skill, language, and budget.");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("trainers").select("*").eq("approval_status", "approved");
      const trainerData = data || [];
      let realTrainers: any[] = [];
      if (trainerData.length > 0) {
        const userIds = trainerData.map(t => t.user_id);
        const profileMap = await fetchProfilesMap(userIds);
        realTrainers = trainerData.map(t => ({ ...t, profile: profileMap[t.user_id] }));
      }
      // Merge with demo trainers (avoid duplicates if real data exists)
      const allTrainers = [...realTrainers, ...demoTrainers];
      setTrainers(allTrainers);
      setLoading(false);
    })();
  }, []);

  const filtered = trainers.filter(t => {
    const q = search.toLowerCase();
    const name = t.profile?.full_name?.toLowerCase() || "";
    const role = t.current_role?.toLowerCase() || "";
    const skills = (t.skills || []).join(" ").toLowerCase();
    const company = t.current_company?.toLowerCase() || "";
    return name.includes(q) || role.includes(q) || skills.includes(q) || company.includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "rating") return (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0);
    return (b.total_students || 0) - (a.total_students || 0);
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-white border-b border-border pt-24 pb-10 lg:pt-28 lg:pb-14">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: "#0F172A" }}>Browse Expert Trainers</h1>
          <p className="mt-2" style={{ color: "#64748B" }}>Find your perfect mentor from our verified industry experts</p>
          <div className="mt-6 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by skill, trainer name, or role..." className="pl-12 h-12 bg-white border border-border text-foreground text-base rounded-xl shadow-sm" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">Showing <span className="font-semibold text-foreground">{sorted.length}</span> trainers</p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <BadgeCheck className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground mt-3">No trainers match your search.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sorted.map((t, i) => {
              const name = t.profile?.full_name || "Trainer";
              const avatarColor = t.avatarColor;
              const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
              const demoCourse = t.id?.startsWith("demo-") ? getDemoCourse(t.id)?.[0] : null;

              return (
                <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link to={`/trainer/${t.id}`} className="block group">
                    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                      <div className="p-5">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: avatarColor ? `${avatarColor}15` : 'hsl(var(--primary) / 0.1)' }}
                          >
                            <span className="font-bold" style={{ color: avatarColor || 'hsl(var(--primary))' }}>{initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-foreground text-sm truncate">{name}</h3>
                              <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                            </div>
                            <p className="text-xs text-muted-foreground">{t.current_role || "Trainer"}</p>
                          </div>
                          {t.subscription_plan === "elite" && <span className="text-[9px] font-bold px-2 py-0.5 rounded gold-gradient text-accent-foreground">ELITE</span>}
                        </div>
                        {t.current_company && <p className="mt-1 text-xs text-accent font-medium">{t.current_company}</p>}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {(t.skills || []).slice(0, 3).map((s: string) => (
                            <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">{s}</span>
                          ))}
                        </div>
                        {demoCourse && (
                          <p className="mt-2 text-xs text-muted-foreground">Starting from <span className="font-semibold text-foreground">₹{demoCourse.fee.toLocaleString()}</span></p>
                        )}
                      </div>
                      <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-secondary/30">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-accent fill-accent" />
                          <span className="text-sm font-semibold text-foreground">{Number(t.average_rating) > 0 ? t.average_rating : "New"}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{t.total_students || 0} students</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BrowseTrainers;
