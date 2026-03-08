import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navBg = scrolled
    ? "bg-white/95 backdrop-blur-md border-b border-border shadow-sm"
    : "bg-transparent";

  const linkColor = "text-muted-foreground hover:text-foreground";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <span className="text-[22px] font-bold" style={{ fontFamily: "Inter, sans-serif" }}>
              <span style={{ color: "#0F172A" }}>Skill</span><span style={{ color: "#1A56DB" }}>Mitra</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {[
              { label: "Browse Trainers", path: "/browse" },
              { label: "How It Works", path: "/how-it-works" },
              { label: "Become a Trainer", path: "/trainer/signup" },
              { label: "Contact", path: "/contact" },
            ].map(item => (
              <Link key={item.path} to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${linkColor}`}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link to="/student/login">
              <Button variant="ghost" size="sm" className="font-medium">Log in</Button>
            </Link>
            <Link to="/student/signup">
              <Button size="sm" className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-lg px-5 transition-colors duration-200">
                Sign Up Free
              </Button>
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg transition-colors text-foreground">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 top-16 bg-white z-40"
          >
            <div className="flex flex-col p-6 gap-2">
              {[
                { label: "Browse Trainers", path: "/browse" },
                { label: "How It Works", path: "/how-it-works" },
                { label: "Become a Trainer", path: "/trainer/signup" },
                { label: "Contact", path: "/contact" },
              ].map(item => (
                <Link key={item.path} to={item.path}
                  className="px-4 py-3.5 rounded-lg text-base font-medium text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <hr className="border-border my-3" />
              <Link to="/student/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full h-12 font-medium">Log in</Button>
              </Link>
              <Link to="/student/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full h-12 bg-primary hover:bg-primary-dark text-primary-foreground font-semibold">
                  Sign Up Free
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
