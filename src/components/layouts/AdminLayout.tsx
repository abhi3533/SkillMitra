import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, DollarSign, CreditCard, BarChart3, AlertTriangle, Award, Mail, LogOut, Menu, X, Bell, Shield, Gift, Wallet, ClipboardCheck, Calendar, Star, TrendingUp, Settings, Megaphone, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SkillMitraLogo from "@/components/SkillMitraLogo";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Trainers", icon: Users, path: "/admin/trainers" },
  { label: "Students", icon: Users, path: "/admin/students" },
  { label: "Courses", icon: BookOpen, path: "/admin/courses" },
  { label: "Sessions", icon: Calendar, path: "/admin/sessions" },
  { label: "Attendance", icon: ClipboardCheck, path: "/admin/attendance" },
  { label: "Payments", icon: DollarSign, path: "/admin/payments" },
  { label: "Payouts", icon: CreditCard, path: "/admin/payouts" },
  { label: "Wallets", icon: Wallet, path: "/admin/wallets" },
  { label: "Referrals", icon: Gift, path: "/admin/referrals" },
  { label: "Subscriptions", icon: TrendingUp, path: "/admin/subscriptions" },
  { label: "Disputes", icon: AlertTriangle, path: "/admin/disputes" },
  { label: "Certificates", icon: Award, path: "/admin/certificates" },
  { label: "Ratings", icon: Star, path: "/admin/ratings" },
  { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { label: "Communications", icon: Megaphone, path: "/admin/communications" },
  { label: "Invite Trainers", icon: UserPlus, path: "/admin/trainer-invitations" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
  { label: "Messages", icon: Mail, path: "/admin/messages" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-border h-16 flex items-center px-4 lg:px-8">
        <button className="lg:hidden mr-4 p-1" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
        </button>
        <SkillMitraLogo darkText height={32} />
        <span className="ml-3 text-[10px] font-bold px-2 py-1 rounded-md bg-primary/10 text-primary uppercase tracking-wider">Admin</span>
        <div className="flex-1" />
        <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-muted mr-2 transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary" />
        </div>
      </header>

      <div className="flex pt-16">
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-60 bg-card border-r border-border transition-transform duration-300 flex flex-col`}>
          <nav className="flex-1 p-3 space-y-0.5">
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

        <main className="flex-1 p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

export default AdminLayout;
