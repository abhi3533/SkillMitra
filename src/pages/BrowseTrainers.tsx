import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { motion } from "framer-motion";
import { Search, Star, BadgeCheck, SlidersHorizontal, X, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profileHelpers";
import { demoTrainers, getDemoCourse } from "@/lib/demoData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrainerCardSkeleton from "@/components/TrainerCardSkeleton";

const ALL_SKILLS = [
  "Python", "Data Science", "Machine Learning", "React", "Node.js", "JavaScript",
  "Figma", "UI Design", "SEO", "Digital Marketing", "Accounting", "Tally",
  "Public Speaking", "Interview Prep", "MongoDB", "Web Design", "GST",
];
const ALL_LANGUAGES = ["English", "Hindi", "Telugu", "Tamil", "Malayalam", "Marathi", "Urdu", "Kannada"];

const TIME_SLOTS = [
  { label: "Early Morning", sub: "6 AM – 9 AM", startHour: 6, endHour: 9 },
  { label: "Morning", sub: "9 AM – 12 PM", startHour: 9, endHour: 12 },
  { label: "Afternoon", sub: "12 PM – 4 PM", startHour: 12, endHour: 16 },
  { label: "Evening", sub: "4 PM – 8 PM", startHour: 16, endHour: 20 },
  { label: "Night", sub: "8 PM – 11 PM", startHour: 20, endHour: 23 },
];
const SCHEDULE_PREFS = [
  { label: "Weekend Only", sub: "Sat & Sun", days: [6, 0] },
  { label: "Weekday Only", sub: "Mon – Fri", days: [1, 2, 3, 4, 5] },
];

const BrowseTrainers = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFeeMap, setCourseFeeMap] = useState<Record<string, number>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([500, 10000]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [genderPref, setGenderPref] = useState<string>("");
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string[]>([]);

  // Availability data from DB
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, any[]>>({});

  usePageMeta({
    title: "Find Expert Trainers — SkillMitra",
    description: "Browse 50+ verified trainers for personal 1:1 skill training. Filter by skill, language, budget. Start with a free trial session today.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Browse Expert Trainers",
      url: "https://skillmitra.online/browse",
      description: "Find verified expert trainers for 1:1 personal skill training across 50+ skills",
      isPartOf: { "@type": "WebSite", name: "SkillMitra", url: "https://skillmitra.online" },
    },
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("trainers").select("*").eq("approval_status", "approved");
      const trainerData = data || [];
      let realTrainers: any[] = [];
      if (trainerData.length > 0) {
        const userIds = trainerData.map(t => t.user_id);
        const profileMap = await fetchProfilesMap(userIds);
        realTrainers = trainerData.map(t => ({ ...t, profile: profileMap[t.user_id] }));

        // Fetch availability and courses for real trainers
        const trainerIds = trainerData.map(t => t.id);
        const [{ data: avail }, { data: courses }] = await Promise.all([
          supabase.from("trainer_availability").select("*").in("trainer_id", trainerIds),
          supabase.from("courses").select("trainer_id, course_fee").in("trainer_id", trainerIds).eq("is_active", true),
        ]);
        if (avail) {
          const map: Record<string, any[]> = {};
          avail.forEach(a => {
            if (!map[a.trainer_id]) map[a.trainer_id] = [];
            map[a.trainer_id].push(a);
          });
          setAvailabilityMap(map);
        }
        // Build min course fee map for real trainers
        if (courses) {
          const feeMap: Record<string, number> = {};
          courses.forEach(c => {
            const fee = Number(c.course_fee) || 0;
            if (!feeMap[c.trainer_id] || fee < feeMap[c.trainer_id]) {
              feeMap[c.trainer_id] = fee;
            }
          });
          setCourseFeeMap(feeMap);
        }
      }
      // Only show demo trainers if no real trainers exist
      setTrainers(realTrainers.length > 0 ? realTrainers : demoTrainers);
      setLoading(false);
    })();
  }, []);

  const toggleLang = (lang: string) => setSelectedLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  const toggleTimeSlot = (slot: string) => setSelectedTimeSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);
  const toggleSchedule = (sched: string) => setSelectedSchedule(prev => prev.includes(sched) ? prev.filter(s => s !== sched) : [...prev, sched]);

  const activeFilterCount = [
    selectedSkill, selectedLanguages.length > 0, genderPref, minRating > 0,
    selectedTimeSlots.length > 0, selectedSchedule.length > 0,
    priceRange[0] !== 500 || priceRange[1] !== 10000,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedSkill(""); setPriceRange([500, 10000]); setSelectedLanguages([]);
    setGenderPref(""); setMinRating(0); setSelectedTimeSlots([]); setSelectedSchedule([]);
  };

  const filtered = useMemo(() => {
    return trainers.filter(t => {
      const q = search.toLowerCase();
      const name = t.profile?.full_name?.toLowerCase() || "";
      const role = t.current_role?.toLowerCase() || "";
      const skills = (t.skills || []).join(" ").toLowerCase();
      const company = t.current_company?.toLowerCase() || "";
      if (q && !name.includes(q) && !role.includes(q) && !skills.includes(q) && !company.includes(q)) return false;

      if (selectedSkill && !(t.skills || []).some((s: string) => s.toLowerCase().includes(selectedSkill.toLowerCase()))) return false;
      if (selectedLanguages.length > 0 && !selectedLanguages.some(l => (t.teaching_languages || []).includes(l))) return false;
      if (minRating > 0 && (Number(t.average_rating) || 0) < minRating) return false;

      // Gender filter
      if (genderPref && genderPref !== "any") {
        const trainerGender = t.profile?.gender?.toLowerCase() || "";
        if (trainerGender !== genderPref.toLowerCase()) return false;
      }

      // Price filter for both demo and real trainers
      if (priceRange[0] !== 500 || priceRange[1] !== 10000) {
        const demoCourse = t.id?.startsWith("demo-") ? getDemoCourse(t.id)?.[0] : null;
        if (demoCourse) {
          if (demoCourse.fee < priceRange[0] || demoCourse.fee > priceRange[1]) return false;
        } else {
          const minFee = courseFeeMap[t.id];
          if (minFee !== undefined) {
            if (minFee < priceRange[0] || minFee > priceRange[1]) return false;
          }
        }
      }

      // Time slot and schedule filtering
      if (selectedTimeSlots.length > 0 || selectedSchedule.length > 0) {
        if (t.id?.startsWith("demo-")) {
          if (selectedTimeSlots.length > 0) {
            const matchesTimeSlot = selectedTimeSlots.some(slotLabel => {
              const slot = TIME_SLOTS.find(s => s.label === slotLabel);
              if (!slot) return false;
              return (slot.startHour < 20 && slot.endHour > 17) || (slot.startHour < 12 && slot.endHour > 9);
            });
            if (!matchesTimeSlot) return false;
          }
        } else {
          const trainerAvail = availabilityMap[t.id] || [];
          if (trainerAvail.length === 0) return false;

          if (selectedTimeSlots.length > 0) {
            const matchesTimeSlot = selectedTimeSlots.some(slotLabel => {
              const slot = TIME_SLOTS.find(s => s.label === slotLabel);
              if (!slot) return false;
              return trainerAvail.some(a => {
                if (!a.is_available || !a.start_time || !a.end_time) return false;
                const startH = parseInt(a.start_time.split(":")[0]);
                const endH = parseInt(a.end_time.split(":")[0]);
                return startH < slot.endHour && endH > slot.startHour;
              });
            });
            if (!matchesTimeSlot) return false;
          }

          if (selectedSchedule.length > 0) {
            const matchesSchedule = selectedSchedule.some(schedLabel => {
              const sched = SCHEDULE_PREFS.find(s => s.label === schedLabel);
              if (!sched) return false;
              return trainerAvail.some(a => a.is_available && sched.days.includes(a.day_of_week));
            });
            if (!matchesSchedule) return false;
          }
        }
      }

      return true;
    });
  }, [trainers, search, selectedSkill, priceRange, selectedLanguages, genderPref, minRating, selectedTimeSlots, selectedSchedule, availabilityMap, courseFeeMap]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "rating") return (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0);
      if (sortBy === "price_low") {
        const aFee = a.id?.startsWith("demo-") ? (getDemoCourse(a.id)?.[0]?.fee || 0) : (courseFeeMap[a.id] || 0);
        const bFee = b.id?.startsWith("demo-") ? (getDemoCourse(b.id)?.[0]?.fee || 0) : (courseFeeMap[b.id] || 0);
        return aFee - bFee;
      }
      if (sortBy === "newest") return (b.experience_years || 0) - (a.experience_years || 0);
      return (b.total_students || 0) - (a.total_students || 0);
    });
  }, [filtered, sortBy, courseFeeMap]);

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Skill */}
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Skill</label>
        <Select value={selectedSkill} onValueChange={setSelectedSkill}>
          <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue placeholder="All Skills" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Skills</SelectItem>
            {ALL_SKILLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Price Range</label>
        <div className="mt-3 px-1">
          <Slider
            min={500} max={10000} step={500}
            value={priceRange}
            onValueChange={(v) => setPriceRange(v as [number, number])}
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>₹{priceRange[0].toLocaleString()}</span>
            <span>₹{priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Language */}
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Language</label>
        <div className="mt-2 space-y-2">
          {ALL_LANGUAGES.map(lang => (
            <label key={lang} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={selectedLanguages.includes(lang)} onCheckedChange={() => toggleLang(lang)} />
              <span className="text-sm text-foreground">{lang}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Gender Preference */}
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Gender Preference</label>
        <Select value={genderPref} onValueChange={setGenderPref}>
          <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue placeholder="No Preference" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">No Preference</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Min Rating */}
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Minimum Rating</label>
        <div className="flex gap-1.5 mt-2">
          {[0, 3, 4, 4.5].map(r => (
            <button key={r} onClick={() => setMinRating(r)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${minRating === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary/30'}`}>
              {r === 0 ? "All" : <><Star className="w-3 h-3 fill-current" />{r}+</>}
            </button>
          ))}
        </div>
      </div>

      {/* Availability - Time Slots */}
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Availability
        </label>
        <p className="text-[11px] text-muted-foreground mt-1 mb-2.5">When can you learn?</p>
        <div className="flex flex-wrap gap-1.5">
          {TIME_SLOTS.map(slot => (
            <button key={slot.label} onClick={() => toggleTimeSlot(slot.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedTimeSlots.includes(slot.label) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary/30'}`}>
              {slot.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {SCHEDULE_PREFS.map(sched => (
            <button key={sched.label} onClick={() => toggleSchedule(sched.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedSchedule.includes(sched.label) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary/30'}`}>
              {sched.label}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-xs text-muted-foreground">
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-card border-b border-border pt-24 pb-10 lg:pt-28 lg:pb-14">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Browse Expert Trainers</h1>
          <p className="mt-2 text-muted-foreground">Find your ideal trainer from our verified industry experts</p>
          <div className="mt-6 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by skill, trainer name, or role..."
              className="pl-12 h-12 bg-background border border-border text-foreground text-base rounded-xl shadow-sm" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                  {activeFilterCount > 0 && <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
                </h3>
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{sorted.length} Trainers</span> Found
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="lg:hidden text-xs gap-1.5" onClick={() => setShowFilters(true)}>
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
                  {activeFilterCount > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
                </Button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price_low">Lowest Price</SelectItem>
                    <SelectItem value="newest">Most Experienced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => <TrainerCardSkeleton key={i} variant="browse" />)}
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-16">
                <BadgeCheck className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground mt-3">No trainers match your filters.</p>
                {activeFilterCount > 0 && <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>Clear Filters</Button>}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
                              {t.profile?.profile_picture_url ? (
                                <img src={t.profile.profile_picture_url} alt={name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                              ) : t.avatarUrl ? (
                                <img src={t.avatarUrl} alt={name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-muted">
                                  {avatarColor ? (
                                    <span className="font-bold" style={{ color: avatarColor }}>{initials}</span>
                                  ) : (
                                    <User className="w-6 h-6 text-muted-foreground" />
                                  )}
                                </div>
                              )}
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
                            <Button size="sm" variant="outline" className="text-[11px] h-7 px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              Book Free Trial
                            </Button>
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
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setShowFilters(false)} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-background border-l border-border overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Filters</h3>
              <button onClick={() => setShowFilters(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-4">
              <FilterSidebar />
            </div>
            <div className="p-4 border-t border-border">
              <Button className="w-full" onClick={() => setShowFilters(false)}>Apply Filters</Button>
            </div>
          </motion.div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default BrowseTrainers;
