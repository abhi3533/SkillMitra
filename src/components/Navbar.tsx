import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navBg = scrolled
    ? "bg-white/80 backdrop-blur-xl border-b border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
    : "bg-transparent";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1">
            <span className="text-[22px] font-bold tracking-tight text-foreground">
              Skill<span className="text-gradient">Mitra</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {[
              { label: "Explore Trainers", path: "/browse" },
              { label: "Become Trainer", path: "/trainer/signup" },
              { label: "How It Works", path: "/how-it-works" },
            ].map(item => (
              <Link key={item.path} to={item.path}
                className="px-4 py-2 rounded-lg text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/student/login">
              <Button variant="ghost" size="sm"
                className="text-[15px] font-medium text-muted-foreground hover:text-foreground">
                Login
              </Button>
            </Link>
            <Link to="/student/signup">
              <Button size="sm" className="hero-gradient text-white font-semibold rounded-xl px-6 h-10 text-[15px] shadow-sm hover:shadow-lg transition-all duration-300">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg transition-colors text-foreground">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 top-[72px] bg-white/95 backdrop-blur-xl z-40"
          >
            <div className="flex flex-col p-6 gap-1">
              {[
                { label: "Explore Trainers", path: "/browse" },
                { label: "Become Trainer", path: "/trainer/signup" },
                { label: "How It Works", path: "/how-it-works" },
              ].map(item => (
                <Link key={item.path} to={item.path}
                  className="px-4 py-3.5 rounded-xl text-[17px] font-medium text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <hr className="border-border my-4" />
              <Link to="/student/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full h-12 font-medium rounded-xl text-[15px]">Login</Button>
              </Link>
              <Link to="/student/signup" onClick={() => setMobileOpen(false)} className="mt-2">
                <Button className="w-full h-12 hero-gradient text-white font-semibold rounded-xl text-[15px]">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
