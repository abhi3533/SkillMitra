import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search, LayoutDashboard, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GlobalSearch from "@/components/GlobalSearch";
import SkillMitraLogo from "@/components/SkillMitraLogo";
import { useAuth } from "@/hooks/useAuth";

const defaultNavLinks = [
  { label: "Browse Trainers", path: "/browse" },
  { label: "How It Works", path: "/how-it-works" },
  { label: "Become a Trainer", path: "/trainer/signup" },
  { label: "Contact", path: "/contact" },
];

const studentNavLinks = [
  { label: "Browse Trainers", path: "/browse" },
  { label: "My Sessions", path: "/student/sessions" },
  { label: "My Courses", path: "/student/courses" },
  { label: "Contact", path: "/contact" },
];

const trainerNavLinks = [
  { label: "My Students", path: "/trainer/students" },
  { label: "My Courses", path: "/trainer/courses" },
  { label: "My Schedule", path: "/trainer/schedule" },
  { label: "Contact", path: "/contact" },
];

const adminNavLinks = [
  { label: "Dashboard", path: "/admin" },
];

const getNavLinks = (role: string | null) => {
  switch (role) {
    case "student": return studentNavLinks;
    case "trainer": return trainerNavLinks;
    case "admin": return adminNavLinks;
    default: return defaultNavLinks;
  }
};

const getRoleConfig = (role: string | null) => {
  switch (role) {
    case "student":
      return { color: "bg-primary", dashboard: "/student/dashboard", profile: "/student/profile" };
    case "trainer":
      return { color: "bg-orange-500", dashboard: "/trainer/dashboard", profile: "/trainer/profile" };
    case "admin":
      return { color: "bg-purple-600", dashboard: "/admin", profile: "/admin/settings" };
    default:
      return { color: "bg-primary", dashboard: "/", profile: "/" };
  }
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, profile, signOut, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isLoggedIn = !!user && !!role;
  const navLinks = getNavLinks(role);
  const roleConfig = getRoleConfig(role);
  const firstName = profile?.full_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "";
  const initial = firstName?.charAt(0)?.toUpperCase() || "U";

  const navBg = scrolled
    ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
    : "bg-background border-b border-transparent";

  const linkColor = "text-muted-foreground hover:text-primary font-medium transition-colors duration-200";

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <SkillMitraLogo darkText height={36} />

            <div className="hidden lg:flex items-center gap-2">
              {navLinks.map(item => {
                const isActive = location.pathname === item.path;
                const isPrimary = item.path === "/browse";
                return (
                  <Link key={item.path} to={item.path}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors duration-200 relative
                      ${isActive || isPrimary
                        ? "text-primary font-semibold"
                        : linkColor}
                      hover:bg-primary/[0.04]
                    `}>
                    {item.label}
                    {(isActive || isPrimary) && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <button onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-sm text-muted-foreground">
                <Search className="w-4 h-4" />
                <span>Search...</span>
                <kbd className="hidden xl:inline text-[10px] font-mono bg-background px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
              </button>

              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none">
                      <div className={`w-8 h-8 rounded-full ${roleConfig.color} flex items-center justify-center text-white text-sm font-semibold`}>
                        {initial}
                      </div>
                      <span className="text-sm font-medium text-foreground">Hi, {firstName}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate(roleConfig.dashboard)} className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Go to Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(roleConfig.profile)} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="font-medium">Log in</Button>
                  </Link>
                  <Link to="/student/signup">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-5 transition-colors duration-200">
                      Sign Up Free
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile right side */}
            <div className="flex items-center gap-2 lg:hidden">
              <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg text-foreground">
                <Search className="w-5 h-5" />
              </button>
              {isLoggedIn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none">
                      <div className={`w-8 h-8 rounded-full ${roleConfig.color} flex items-center justify-center text-white text-sm font-semibold`}>
                        {initial}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2 text-sm font-medium text-foreground">Hi, {firstName}</div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(roleConfig.dashboard)} className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Go to Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(roleConfig.profile)} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg text-foreground">
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 top-16 bg-background z-40"
            >
              <div className="flex flex-col p-6 gap-2">
                {navLinks.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}
                      className={`px-4 py-4 rounded-xl text-[15px] font-medium transition-colors ${
                        isActive
                          ? "text-primary bg-primary/[0.06] font-semibold"
                          : "text-foreground hover:bg-muted"
                      }`}
                      onClick={() => setMobileOpen(false)}>
                      {item.label}
                    </Link>
                  );
                })}
                <hr className="border-border my-3" />
                {isLoggedIn ? (
                  <>
                    <Link to={roleConfig.dashboard} onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full h-12 font-medium">Go to Dashboard</Button>
                    </Link>
                    <Button variant="ghost" className="w-full h-12 font-medium text-destructive" onClick={() => { setMobileOpen(false); handleLogout(); }}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full h-12 font-medium">Log in</Button>
                    </Link>
                    <Link to="/student/signup" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                        Sign Up Free
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Navbar;
