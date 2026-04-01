import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, Users, DollarSign, Award, TrendingUp, User, LogOut, Menu, X, Bell, Calendar, Wallet, Gift, ClipboardCheck, Star, Video, Settings } from "lucide-react";
import MobileBottomNav from "@/components/MobileBottomNav";
import SkillMitraLogo from "@/components/SkillMitraLogo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const sidebarItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/trainer/dashboard" },
  { label: "Sessions", icon: Video, path: "/trainer/sessions" },
  { label: "My Courses", icon: BookOpen, path: "/trainer/courses" },
  { label: "My Students", icon: Users, path: "/trainer/students" },
  { label: "Schedule", icon: Calendar, path: "/trainer/schedule" },
  { label: "Attendance", icon: ClipboardCheck, path: "/trainer/attendance" },
  { label: "Earnings", icon: DollarSign, path: "/trainer/earnings" },
  { label: "Wallet", icon: Wallet, path: "/trainer/wallet" },
  { label: "Reviews", icon: Star, path: "/trainer/reviews" },
  { label: "Certificates", icon: Award, path: "/trainer/certificates" },
  { label: "Subscription", icon: TrendingUp, path: "/trainer/subscription" },
  { label: "Referrals", icon: Gift, path: "/trainer/referrals" },
  { label: "Trial Settings", icon: Settings, path: "/trainer/trial-settings" },
  { label: "Profile", icon: User, path: "/trainer/profile" },
];

const TrainerLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false);
      setUnreadCount(count || 0);
    };
    fetchUnread();

    const channel = supabase.channel("trainer-notif-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        fetchUnread();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border shadow-sm h-16 flex items-center px-4 lg:px-8">
        <button className="lg:hidden mr-4 p-1" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
        </button>
        <SkillMitraLogo darkText height={32} />
        <div className="flex-1" />
        <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-muted mr-2 transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50">
              {profile?.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt={profile?.full_name || "Trainer"} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-accent text-xs font-bold">{profile?.full_name?.[0] || "T"}</span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{profile?.full_name || "Trainer"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email || user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/trainer/profile")} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" /> View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/trainer/profile")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" /> Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/trainer/trial-settings")} className="cursor-pointer">
              <Bell className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex pt-16">
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-60 bg-card border-r border-border transition-transform duration-300 flex flex-col`}>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {sidebarItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.label} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}>
                  <item.icon className={`w-[18px] h-[18px] ${active ? "text-primary" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-border">
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive w-full transition-colors duration-200">
              <LogOut className="w-[18px] h-[18px]" /> Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8 pb-40 lg:pb-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
      <MobileBottomNav role="trainer" />
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

export default TrainerLayout;
