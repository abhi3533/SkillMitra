import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, Brain, FileText, Award, Users, User, LogOut, Menu, X, Bell, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const sidebarItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/student/dashboard" },
  { label: "My Courses", icon: BookOpen, path: "/student/courses" },
  { label: "AI Interview", icon: Brain, path: "/student/interview" },
  { label: "Resume Builder", icon: FileText, path: "/student/resume" },
  { label: "Certificates", icon: Award, path: "/student/certificates" },
  { label: "Referrals", icon: Users, path: "/student/referrals" },
  { label: "Profile", icon: User, path: "/student/profile" },
];

const StudentLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-border h-16 flex items-center px-4 lg:px-8">
        <button className="lg:hidden mr-4 p-1" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
        </button>
        <Link to="/" className="flex items-center">
          <span className="text-[22px] font-bold text-foreground">Skill<span className="text-primary">Mitra</span></span>
        </Link>
        <div className="flex-1" />
        <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-muted mr-2 transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary text-xs font-bold">{profile?.full_name?.[0] || "U"}</span>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-60 bg-card border-r border-border transition-transform duration-300 flex flex-col`}>
          <nav className="flex-1 p-3 space-y-0.5">
            {sidebarItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.label} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

export default StudentLayout;
