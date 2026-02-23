import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, Calendar, DollarSign, Award, CreditCard, Settings, LogOut, Menu, X, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Trainers", icon: Users, path: "/admin/trainers" },
  { label: "Students", icon: Users, path: "/admin/students" },
  { label: "Courses", icon: BookOpen, path: "/admin/courses" },
  { label: "Sessions", icon: Calendar, path: "/admin" },
  { label: "Payments", icon: DollarSign, path: "/admin" },
  { label: "Certificates", icon: Award, path: "/admin" },
  { label: "Subscriptions", icon: CreditCard, path: "/admin" },
  { label: "Settings", icon: Settings, path: "/admin" },
];

const AdminDashboard = () => {
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
        <button className="relative p-2 rounded-lg hover:bg-muted mr-2">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
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
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Platform overview and management</p>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-6">
            {[
              { label: "Total Trainers", value: "856" },
              { label: "Pending Approvals", value: "12" },
              { label: "Total Students", value: "12,543" },
              { label: "Total Revenue", value: "₹48.2L" },
              { label: "Active Sessions", value: "89" },
              { label: "Certificates", value: "3,241" },
            ].map(card => (
              <div key={card.label} className="bg-card rounded-xl border p-4">
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-card rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Trainer Applications</h2>
              <div className="space-y-3">
                {[
                  { name: "Arjun Mehta", skill: "React Developer", date: "2 hours ago" },
                  { name: "Pooja Gupta", skill: "Data Analyst", date: "5 hours ago" },
                  { name: "Kiran Das", skill: "UI/UX Designer", date: "1 day ago" },
                ].map(app => (
                  <div key={app.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full hero-gradient flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-bold">{app.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{app.name}</p>
                        <p className="text-xs text-muted-foreground">{app.skill} • {app.date}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">Review</Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Enrollments</h2>
              <div className="space-y-3">
                {[
                  { student: "Kavya M.", course: "Full Stack Dev", trainer: "Rajesh K.", amount: "₹14,999" },
                  { student: "Rohit S.", course: "Data Science", trainer: "Priya S.", amount: "₹12,999" },
                  { student: "Meera K.", course: "Digital Marketing", trainer: "Sneha I.", amount: "₹8,999" },
                ].map(e => (
                  <div key={e.student} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.student} → {e.course}</p>
                      <p className="text-xs text-muted-foreground">Trainer: {e.trainer}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{e.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

export default AdminDashboard;
