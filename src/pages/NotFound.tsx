import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import SkillMitraLogo from "@/components/SkillMitraLogo";

const FloatingShape = ({ delay, x, y, size, color }: { delay: number; x: string; y: string; size: number; color: string }) => (
  <motion.div
    className="absolute rounded-full opacity-20"
    style={{ left: x, top: y, width: size, height: size, backgroundColor: color }}
    animate={{ y: [0, -12, 0], scale: [1, 1.1, 1] }}
    transition={{ duration: 3 + delay, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "Page Not Found — SkillMitra";
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/browse");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">
      {/* Floating background shapes */}
      <FloatingShape delay={0} x="10%" y="15%" size={64} color="hsl(var(--primary))" />
      <FloatingShape delay={0.8} x="80%" y="20%" size={40} color="hsl(var(--accent))" />
      <FloatingShape delay={1.5} x="15%" y="75%" size={48} color="hsl(var(--primary))" />
      <FloatingShape delay={2} x="75%" y="70%" size={56} color="hsl(var(--accent))" />
      <FloatingShape delay={0.5} x="50%" y="10%" size={32} color="hsl(var(--primary))" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center max-w-lg px-6"
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <SkillMitraLogo darkText height={36} />
        </div>

        {/* Animated 404 illustration */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative mx-auto mb-8"
        >
          <div className="relative w-40 h-40 mx-auto">
            {/* Glow */}
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-125" />
            {/* Circle */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/[0.08] to-primary/[0.03] border-2 border-primary/10 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl font-extrabold bg-gradient-to-b from-primary to-primary/60 bg-clip-text text-transparent">
                  404
                </span>
              </div>
            </div>
            {/* Orbiting dot */}
            <motion.div
              className="absolute w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]"
              style={{ top: "50%", left: "50%", marginTop: -6, marginLeft: -6 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              custom={70}
            >
              <motion.div
                className="w-3 h-3 rounded-full bg-primary"
                style={{ transform: "translateX(70px)" }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Message */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          Oops! This Page Doesn't Exist
        </h1>
        <p className="mt-3 text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
          Looks like you've wandered off the learning path. Let's get you back on track!
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mt-8 relative max-w-sm mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search trainers, skills..."
            className="pl-10 pr-12 h-12 rounded-xl border-border bg-card text-foreground shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <ArrowRight className="w-4 h-4 text-primary-foreground" />
          </button>
        </form>

        {/* Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button size="lg" className="gap-2 w-full rounded-xl font-semibold">
              <Home className="w-4 h-4" /> Go to Homepage
            </Button>
          </Link>
          <Link to="/browse">
            <Button size="lg" variant="outline" className="gap-2 w-full rounded-xl font-semibold border-primary/30 text-primary hover:bg-primary/5">
              <Search className="w-4 h-4" /> Browse Trainers
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted-foreground/60">
          If you think this is an error, <Link to="/contact" className="text-primary hover:underline">contact us</Link>.
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
