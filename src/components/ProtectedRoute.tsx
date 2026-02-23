import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, role, loading } = useAuth();

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
    // Redirect to appropriate login
    if (allowedRoles.includes("admin")) return <Navigate to="/student/login" replace />;
    if (allowedRoles.includes("trainer")) return <Navigate to="/trainer/login" replace />;
    return <Navigate to="/student/login" replace />;
  }

  if (role && !allowedRoles.includes(role)) {
    // Redirect to correct dashboard
    if (role === "student") return <Navigate to="/student/dashboard" replace />;
    if (role === "trainer") return <Navigate to="/trainer/dashboard" replace />;
    if (role === "admin") return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
