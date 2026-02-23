import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, BookOpen, Calendar, Brain, FileText, Award, Users, User, LogOut, Menu, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const sidebarItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/student/dashboard" },
  { label: "My Courses", icon: BookOpen, path: "/student/courses" },
  { label: "Sessions", icon: Calendar, path: "/student/dashboard" },
  { label: "AI Interview", icon: Brain, path: "/student/interview" },
  { label: "Resume Builder", icon: FileText, path: "/student/resume" },
  { label: "Certificates", icon: Award, path: "/student/dashboard" },
  { label: "Referrals", icon: Users, path: "/student/referrals" },
  { label: "Profile", icon: User, path: "/student/dashboard" },
];

const StudentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
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
        <div className="w-8 h-8 rounded-full hero-gradient flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">U</span>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-card border-r transition-transform duration-300 flex flex-col`}>
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map(item => (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path ? "hero-gradient text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          {/* Overview content */}
          <h1 className="text-2xl font-bold text-foreground">Welcome back! 👋</h1>
          <p className="mt-1 text-muted-foreground">Here's your learning progress overview</p>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Active Courses", value: "2", color: "hero-gradient" },
              { label: "Sessions Done", value: "18", color: "gold-gradient" },
              { label: "AI Interview Score", value: "78%", color: "bg-success" },
              { label: "Resume Score", value: "85%", color: "hero-gradient" },
            ].map(card => (
              <div key={card.label} className="bg-card rounded-xl border p-5">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                  <span className="text-primary-foreground font-bold text-sm">{card.value[0]}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Current Course Progress */}
          <div className="mt-8 bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Current Course Progress</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl hero-gradient flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold">R</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Full Stack Web Development</h3>
                <p className="text-sm text-muted-foreground">Trainer: Rajesh Kumar</p>
                <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full hero-gradient rounded-full" style={{ width: "62%" }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">62% complete • 12/20 sessions done</p>
              </div>
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="mt-6 bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Sessions</h2>
            <div className="space-y-3">
              {[
                { title: "React Hooks Deep Dive", trainer: "Rajesh Kumar", date: "Today, 6:00 PM", live: true },
                { title: "Database Design", trainer: "Rajesh Kumar", date: "Tomorrow, 7:00 PM", live: false },
                { title: "REST API Building", trainer: "Rajesh Kumar", date: "Wed, 6:00 PM", live: false },
              ].map(session => (
                <div key={session.title} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{session.title}</p>
                    <p className="text-xs text-muted-foreground">{session.trainer} • {session.date}</p>
                  </div>
                  {session.live ? (
                    <Button size="sm" className="bg-success text-success-foreground animate-pulse-glow border-0 text-xs">Join Now</Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">{session.date}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

export default StudentDashboard;
