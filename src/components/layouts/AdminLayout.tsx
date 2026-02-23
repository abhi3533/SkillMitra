import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, DollarSign, Award, CreditCard, Settings, LogOut, Menu, X, Bell, Shield, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Trainers", icon: Users, path: "/admin/trainers" },
  { label: "Students", icon: Users, path: "/admin/students" },
  { label: "Courses", icon: BookOpen, path: "/admin/courses" },
  { label: "Payments", icon: DollarSign, path: "/admin/payments" },
  { label: "Payouts", icon: CreditCard, path: "/admin/payouts" },
  { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
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
      <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b h-16 flex items-center px-4 lg:px-8">
        <button className="lg:hidden mr-4" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <span className="text-lg font-bold text-foreground">Skill<span className="text-accent">Mitra</span></span>
        </Link>
        <span className="ml-3 text-xs font-bold px-2 py-1 rounded bg-destructive text-destructive-foreground">ADMIN</span>
        <div className="flex-1" />
        <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-muted mr-2">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
          <Shield className="w-4 h-4 text-destructive-foreground" />
        </div>
      </header>

      <div className="flex pt-16">
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-card border-r transition-transform duration-300 flex flex-col`}>
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map(item => (
              <Link key={item.label} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path ? "hero-gradient text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <item.icon className="w-5 h-5" />{item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors">
              <LogOut className="w-5 h-5" /> Sign Out
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
