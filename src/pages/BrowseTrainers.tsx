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
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BrowseTrainers = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("trainers").select("*").eq("approval_status", "approved");
      const trainerData = data || [];
      if (trainerData.length > 0) {
        const userIds = trainerData.map(t => t.user_id);
        const profileMap = await fetchProfilesMap(userIds);
        setTrainers(trainerData.map(t => ({ ...t, profile: profileMap[t.user_id] })));
      }
      setLoading(false);
    })();
  }, []);

  const filtered = trainers.filter(t => {
    const q = search.toLowerCase();
    const name = t.profile?.full_name?.toLowerCase() || "";
    const role = t.current_role?.toLowerCase() || "";
    const skills = (t.skills || []).join(" ").toLowerCase();
    return name.includes(q) || role.includes(q) || skills.includes(q);
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-primary pt-24 pb-10 lg:pt-28 lg:pb-14">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-primary-foreground">Browse Expert Trainers</h1>
          <p className="mt-2 text-primary-foreground/60">Find your perfect mentor from our verified industry experts</p>
          <div className="mt-6 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by skill, trainer name, or role..." className="pl-12 h-12 bg-card border-0 shadow-lg text-foreground text-base rounded-xl" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">Showing <span className="font-semibold text-foreground">{filtered.length}</span> trainers</p>
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
            {[1, 2, 3].map(i => <div key={i} className="h-48 skeleton rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BadgeCheck className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground mt-3">{trainers.length === 0 ? "No verified trainers yet. Check back soon!" : "No trainers match your search."}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/trainer/${t.id}`} className="block group">
                  <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold">{t.profile?.full_name?.[0] || "T"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-foreground text-sm truncate">{t.profile?.full_name || "Trainer"}</h3>
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
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BrowseTrainers;
