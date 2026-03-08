import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, BadgeCheck, BookOpen, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { demoTrainers, demoCourses } from "@/lib/demoData";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

const GlobalSearch = ({ open, onClose }: GlobalSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ trainers: any[]; courses: any[] }>({ trainers: [], courses: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults({ trainers: [], courses: [] });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults({ trainers: [], courses: [] }); return; }
    const q = query.toLowerCase();

    // Search demo data instantly
    const matchedTrainers = demoTrainers.filter(t => {
      const name = t.profile?.full_name?.toLowerCase() || "";
      const skills = (t.skills || []).join(" ").toLowerCase();
      const role = t.current_role?.toLowerCase() || "";
      return name.includes(q) || skills.includes(q) || role.includes(q);
    }).slice(0, 4);

    const matchedCourses = demoCourses.filter(c => {
      return c.title.toLowerCase().includes(q) || c.curriculum.join(" ").toLowerCase().includes(q);
    }).slice(0, 4);

    setResults({ trainers: matchedTrainers, courses: matchedCourses });
  }, [query]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const handleSelect = (path: string) => { onClose(); navigate(path); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-foreground/60 backdrop-blur-sm flex items-start justify-center pt-[10vh]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl mx-4 bg-background rounded-2xl border border-border shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search trainers, skills, courses..."
                className="flex-1 bg-transparent outline-none text-foreground text-base placeholder:text-muted-foreground"
              />
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Results */}
            {query.trim() && (
              <div className="max-h-[60vh] overflow-y-auto p-3">
                {results.trainers.length === 0 && results.courses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No results for "{query}"</p>
                  </div>
                ) : (
                  <>
                    {results.trainers.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">Trainers</p>
                        {results.trainers.map(t => (
                          <button key={t.id} onClick={() => handleSelect(`/trainer/${t.id}`)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${t.avatarColor}15` }}>
                              <span className="text-xs font-bold" style={{ color: t.avatarColor }}>
                                {(t.profile?.full_name || "T").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-foreground truncate">{t.profile?.full_name}</span>
                                <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{t.current_role} • {(t.skills || []).slice(0, 2).join(", ")}</p>
                            </div>
                            <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Star className="w-3 h-3 text-accent fill-accent" />{t.average_rating}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {results.courses.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">Courses</p>
                        {results.courses.map(c => (
                          <button key={c.id} onClick={() => handleSelect(`/trainer/${c.trainerId}`)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-foreground truncate block">{c.title}</span>
                              <p className="text-xs text-muted-foreground">{c.sessions} sessions • ₹{c.fee.toLocaleString()}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {!query.trim() && (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-muted-foreground">Start typing to search trainers, skills, and courses</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;
