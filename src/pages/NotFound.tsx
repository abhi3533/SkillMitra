import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-primary">404</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
        <p className="mt-3 text-muted-foreground">
          The page <code className="text-sm bg-muted px-2 py-0.5 rounded">{location.pathname}</code> doesn't exist.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="gap-2"><Home className="w-4 h-4" /> Back to Home</Button>
          </Link>
          <Link to="/browse">
            <Button variant="outline">Browse Trainers</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
