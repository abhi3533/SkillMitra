import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Search, Calendar, User, Users } from "lucide-react";

const studentItems = [
  { label: "Home", icon: LayoutDashboard, path: "/student/dashboard" },
  { label: "Browse", icon: Search, path: "/browse-trainers" },
  { label: "Sessions", icon: Calendar, path: "/student/sessions" },
  { label: "Profile", icon: User, path: "/student/profile" },
];

const trainerItems = [
  { label: "Home", icon: LayoutDashboard, path: "/trainer/dashboard" },
  { label: "Sessions", icon: Calendar, path: "/trainer/sessions" },
  { label: "Students", icon: Users, path: "/trainer/students" },
  { label: "Profile", icon: User, path: "/trainer/profile" },
];

const MobileBottomNav = ({ role }: { role: "student" | "trainer" }) => {
  const location = useLocation();
  const items = role === "student" ? studentItems : trainerItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex lg:hidden safe-area-bottom">
      {items.map(item => {
        const active = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}>
            <item.icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
            <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
