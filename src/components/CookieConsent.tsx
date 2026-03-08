import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  };

  const manage = () => {
    localStorage.setItem("cookie-consent", "essential-only");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[55] p-4 bg-card border-t border-border shadow-xl animate-in slide-in-from-bottom-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            We use cookies to improve your experience on SkillMitra. By continuing to use our platform, you agree to our{" "}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={manage} className="text-xs min-h-[44px] sm:min-h-[36px]">
            Manage Preferences
          </Button>
          <Button size="sm" onClick={accept} className="text-xs min-h-[44px] sm:min-h-[36px]">
            Accept All
          </Button>
          <button onClick={manage} className="p-1.5 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
