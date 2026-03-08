import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "Page Not Found — SkillMitra";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <div className="flex items-center justify-center mb-8">
          <Link to="/">
            <img src="/skillmitra-logo.png" alt="SkillMitra" className="h-10" />
          </Link>
        </div>
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-primary">404</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
        <p className="mt-3 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="gap-2 w-full"><Home className="w-4 h-4" /> Go Home</Button>
          </Link>
          <Link to="/browse">
            <Button variant="outline" className="gap-2 w-full"><Search className="w-4 h-4" /> Browse Trainers</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
