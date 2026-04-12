import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg hero-gradient animate-pulse flex items-center justify-center">
            <span className="text-primary-foreground font-bold">S</span>
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Save the current URL so we can restore it after login.
    // Only save admin paths (the other roles don't have this issue yet).
    if (allowedRoles.includes("admin")) {
      const currentPath = location.pathname + location.search;
      if (currentPath !== "/admin/login") {
        sessionStorage.setItem("admin_return_to", currentPath);
      }
      return <Navigate to="/admin/login" replace />;
    }
    if (allowedRoles.includes("trainer")) return <Navigate to="/trainer/login" replace />;
    return <Navigate to="/student/login" replace />;
  }

  if (!role) {
    // User exists but has no assigned role — treat as unauthorized
    if (allowedRoles.includes("admin")) return <Navigate to="/admin/login" replace />;
    if (allowedRoles.includes("trainer")) return <Navigate to="/trainer/login" replace />;
    return <Navigate to="/student/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Wrong role — redirect to their own dashboard
    if (role === "student") return <Navigate to="/student/dashboard" replace />;
    if (role === "trainer") return <Navigate to="/trainer/dashboard" replace />;
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
