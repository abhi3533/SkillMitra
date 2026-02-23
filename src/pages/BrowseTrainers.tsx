import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Star, BadgeCheck, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const allTrainers = [
  { id: "1", name: "Priya Sharma", role: "Senior Data Scientist", company: "Google", prevCompany: "Amazon", skills: ["Python", "Machine Learning", "Data Science", "TensorFlow"], rating: 4.9, reviews: 127, price: 2999, languages: ["English", "Hindi"], verified: true, elite: true, students: 245 },
  { id: "2", name: "Rajesh Kumar", role: "Full Stack Developer", company: "Microsoft", prevCompany: "Infosys", skills: ["React", "Node.js", "TypeScript", "MongoDB"], rating: 4.8, reviews: 98, price: 1999, languages: ["English", "Hindi", "Telugu"], verified: true, elite: false, students: 189 },
  { id: "3", name: "Anitha Reddy", role: "UX Design Lead", company: "Flipkart", prevCompany: "Ola", skills: ["Figma", "UX Research", "UI Design", "Prototyping"], rating: 4.9, reviews: 156, price: 2499, languages: ["English", "Telugu"], verified: true, elite: true, students: 312 },
  { id: "4", name: "Vikram Patel", role: "Cloud Architect", company: "Amazon", prevCompany: "TCS", skills: ["AWS", "DevOps", "Docker", "Kubernetes"], rating: 4.7, reviews: 85, price: 3499, languages: ["English", "Hindi"], verified: true, elite: false, students: 156 },
  { id: "5", name: "Sneha Iyer", role: "Digital Marketing Head", company: "Swiggy", prevCompany: "Zomato", skills: ["SEO", "Google Ads", "Analytics", "Social Media"], rating: 4.8, reviews: 112, price: 1499, languages: ["English", "Tamil", "Hindi"], verified: true, elite: false, students: 278 },
  { id: "6", name: "Arjun Nair", role: "Cyber Security Expert", company: "TCS", prevCompany: "Wipro", skills: ["Ethical Hacking", "Network Security", "VAPT"], rating: 4.9, reviews: 73, price: 2999, languages: ["English", "Hindi"], verified: true, elite: true, students: 134 },
  { id: "7", name: "Deepika Joshi", role: "Product Manager", company: "Razorpay", prevCompany: "Paytm", skills: ["Product Strategy", "Roadmapping", "User Research"], rating: 4.6, reviews: 64, price: 3999, languages: ["English", "Hindi"], verified: true, elite: false, students: 98 },
  { id: "8", name: "Suresh Babu", role: "Mobile App Developer", company: "PhonePe", prevCompany: "Myntra", skills: ["Flutter", "React Native", "Dart", "Firebase"], rating: 4.8, reviews: 91, price: 2499, languages: ["English", "Telugu", "Tamil"], verified: true, elite: false, students: 167 },
  { id: "9", name: "Meghna Rao", role: "AI/ML Engineer", company: "Nvidia", prevCompany: "Intel", skills: ["Deep Learning", "NLP", "Computer Vision", "PyTorch"], rating: 4.9, reviews: 108, price: 4999, languages: ["English", "Hindi"], verified: true, elite: true, students: 201 },
];

const skillCategories = ["All Skills", "Web Development", "Data Science", "Cloud & DevOps", "UI/UX Design", "Digital Marketing", "Mobile Development", "Cyber Security", "AI & ML", "Product Management"];
const languages = ["All Languages", "English", "Hindi", "Telugu", "Tamil"];

const BrowseTrainers = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = allTrainers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.skills.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
    t.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="hero-gradient pt-24 pb-10 lg:pt-28 lg:pb-14">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-primary-foreground">Browse Expert Trainers</h1>
          <p className="mt-2 text-primary-foreground/60">Find your perfect mentor from 850+ verified industry experts</p>

          {/* Search Bar */}
          <div className="mt-6 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by skill, trainer name, or role..."
              className="pl-12 h-12 bg-card border-0 shadow-lg text-foreground text-base rounded-xl"
            />
          </div>

          {/* Trending */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-primary-foreground/40 py-1">Trending:</span>
            {["Python", "React", "Data Science", "AWS", "Figma", "Flutter", "SEO", "Ethical Hacking"].map(tag => (
              <button key={tag} onClick={() => setSearch(tag)} className="text-xs px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground/70 hover:bg-primary-foreground/20 transition-colors font-medium">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> trainers
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
            </Button>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`${showFilters ? "fixed inset-0 z-50 bg-card p-6 overflow-y-auto" : "hidden"} lg:block lg:relative lg:w-64 lg:flex-shrink-0`}>
            {showFilters && (
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h3 className="font-semibold text-foreground">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Skill Category</h4>
                <div className="space-y-2">
                  {skillCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                      <input type="radio" name="category" className="accent-primary" defaultChecked={cat === "All Skills"} />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Language</h4>
                <div className="space-y-2">
                  {languages.map(lang => (
                    <label key={lang} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                      <input type="checkbox" className="accent-primary" defaultChecked={lang === "All Languages"} />
                      {lang}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Rating</h4>
                <div className="space-y-2">
                  {["4.5+ Stars", "4.0+ Stars", "3.5+ Stars"].map(r => (
                    <label key={r} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                      <input type="radio" name="rating" className="accent-primary" />
                      {r}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Price Range</h4>
                <input type="range" min={999} max={25000} defaultValue={25000} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>₹999</span><span>₹25,000</span>
                </div>
              </div>
            </div>

            {showFilters && (
              <Button className="w-full mt-6 lg:hidden" onClick={() => setShowFilters(false)}>Apply Filters</Button>
            )}
          </aside>

          {/* Trainer Grid */}
          <div className="flex-1">
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/trainer/${t.id}`} className="block group">
                    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                      <div className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl hero-gradient flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-foreground font-bold">{t.name[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-foreground text-sm truncate">{t.name}</h3>
                              {t.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground">{t.role}</p>
                          </div>
                          {t.elite && <span className="text-[9px] font-bold px-2 py-0.5 rounded gold-gradient text-accent-foreground">ELITE</span>}
                        </div>

                        <div className="mt-1">
                          <span className="text-xs text-accent font-medium">{t.company}</span>
                          <span className="text-xs text-muted-foreground"> • ex-{t.prevCompany}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-3">
                          {t.skills.slice(0, 3).map(s => (
                            <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">{s}</span>
                          ))}
                          {t.skills.length > 3 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">+{t.skills.length - 3}</span>}
                        </div>

                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <span>{t.languages.join(", ")}</span>
                          <span>•</span>
                          <span>{t.students} students</span>
                        </div>
                      </div>

                      <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-secondary/30">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-accent fill-accent" />
                          <span className="text-sm font-semibold text-foreground">{t.rating}</span>
                          <span className="text-xs text-muted-foreground">({t.reviews})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">From </span>
                          <span className="font-bold text-foreground">₹{t.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BrowseTrainers;
