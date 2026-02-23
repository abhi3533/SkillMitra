import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Users, Calendar, DollarSign, Award, User, LogOut, Menu, X, Bell, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const sidebarItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/trainer/dashboard" },
  { label: "My Courses", icon: BookOpen, path: "/trainer/courses" },
  { label: "My Students", icon: Users, path: "/trainer/students" },
  { label: "Schedule", icon: Calendar, path: "/trainer/dashboard" },
  { label: "Earnings", icon: DollarSign, path: "/trainer/earnings" },
  { label: "Certificates", icon: Award, path: "/trainer/certificates" },
  { label: "Subscription", icon: TrendingUp, path: "/trainer/subscription" },
  { label: "Profile", icon: User, path: "/trainer/dashboard" },
];

const TrainerDashboard = () => {
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
        <div className="flex-1" />
        <button className="relative p-2 rounded-lg hover:bg-muted mr-2">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
        </button>
        <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center">
          <span className="text-accent-foreground text-xs font-bold">T</span>
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
          <h1 className="text-2xl font-bold text-foreground">Trainer Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Manage your students, courses, and earnings</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Active Students", value: "24", color: "hero-gradient" },
              { label: "This Month Earnings", value: "₹45,200", color: "gold-gradient" },
              { label: "Total Sessions", value: "156", color: "bg-success" },
              { label: "Avg. Rating", value: "4.8★", color: "hero-gradient" },
            ].map(card => (
              <div key={card.label} className="bg-card rounded-xl border p-5">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                  <span className="text-primary-foreground font-bold text-xs">{card.value.slice(0, 2)}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Today's Sessions */}
          <div className="mt-8 bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Today's Sessions</h2>
            <div className="space-y-3">
              {[
                { title: "React Hooks Deep Dive", student: "Kavya M.", time: "6:00 PM", live: true },
                { title: "Python Basics", student: "Rohit S.", time: "7:30 PM", live: false },
              ].map(s => (
                <div key={s.title} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full hero-gradient flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">{s.student[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.student} • {s.time}</p>
                    </div>
                  </div>
                  {s.live ? (
                    <Button size="sm" className="bg-success text-success-foreground animate-pulse-glow border-0 text-xs">Join Now</Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">{s.time}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="mt-6 bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Reviews</h2>
            <div className="space-y-3">
              {[
                { student: "Kavya M.", rating: 5, text: "Excellent session on React hooks! Very clear explanations." },
                { student: "Meera K.", rating: 5, text: "Best teacher I've had. Patient and thorough." },
              ].map(r => (
                <div key={r.student} className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{r.student}</span>
                    <span className="text-accent text-xs">{"★".repeat(r.rating)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

export default TrainerDashboard;
