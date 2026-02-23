import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === "/";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHome ? "bg-transparent" : "bg-card shadow-sm border-b"}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg hero-gradient flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className={`text-xl font-bold ${isHome ? "text-primary-foreground" : "text-foreground"}`}>
              Skill<span className="text-accent">Mitra</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            <Link to="/browse" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isHome ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              Browse Trainers
            </Link>
            <Link to="/trainer/signup" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isHome ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              Become a Trainer
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/student/login">
              <Button variant="ghost" className={`${isHome ? "text-primary-foreground hover:bg-primary-foreground/10" : ""}`}>
                Log in
              </Button>
            </Link>
            <Link to="/student/signup">
              <Button className="gold-gradient text-accent-foreground font-semibold shadow-md hover:shadow-lg transition-shadow border-0">
                Sign Up Free
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className={`lg:hidden p-2 rounded-lg ${isHome ? "text-primary-foreground" : "text-foreground"}`}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-card border-b shadow-lg"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              <Link to="/browse" className="px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted" onClick={() => setMobileOpen(false)}>
                Browse Trainers
              </Link>
              <Link to="/trainer/signup" className="px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted" onClick={() => setMobileOpen(false)}>
                Become a Trainer
              </Link>
              <hr className="border-border my-2" />
              <Link to="/student/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">Log in</Button>
              </Link>
              <Link to="/student/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full gold-gradient text-accent-foreground font-semibold border-0">Sign Up Free</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
