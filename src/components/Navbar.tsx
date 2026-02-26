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

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? "bg-white/70 backdrop-blur-2xl border-b border-border/40 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        : "bg-transparent"
    }`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-[20px] font-bold tracking-[-0.02em] text-foreground">
              skill<span className="font-extrabold text-primary">mitra</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {[
              { label: "Trainers", path: "/browse" },
              { label: "How It Works", path: "/how-it-works" },
              { label: "Pricing", path: "/pricing" },
            ].map(item => (
              <Link key={item.path} to={item.path}
                className="px-3.5 py-2 rounded-lg text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Link to="/student/login">
              <Button variant="ghost" size="sm" className="text-[14px] font-medium text-muted-foreground hover:text-foreground h-9 px-3">
                Log in
              </Button>
            </Link>
            <Link to="/student/signup">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 font-medium rounded-lg px-4 h-9 text-[14px] transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-foreground">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="lg:hidden fixed inset-0 top-16 bg-white/95 backdrop-blur-2xl z-40"
          >
            <div className="flex flex-col p-6 gap-1">
              {[
                { label: "Trainers", path: "/browse" },
                { label: "How It Works", path: "/how-it-works" },
                { label: "Pricing", path: "/pricing" },
              ].map(item => (
                <Link key={item.path} to={item.path}
                  className="px-3 py-3 rounded-lg text-[16px] font-medium text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <hr className="border-border/50 my-4" />
              <Link to="/student/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full h-11 font-medium rounded-lg text-[14px] border-border">Log in</Button>
              </Link>
              <Link to="/student/signup" onClick={() => setMobileOpen(false)} className="mt-2">
                <Button className="w-full h-11 bg-foreground text-background font-medium rounded-lg text-[14px]">
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
