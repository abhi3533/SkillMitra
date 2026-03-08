import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

const PWAInstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    const visits = parseInt(localStorage.getItem("pwa-visit-count") || "0", 10) + 1;
    localStorage.setItem("pwa-visit-count", String(visits));

    if (visits < 3) return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    }
    setShow(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom-4">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground text-sm font-bold">SM</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Install SkillMitra</p>
          <p className="text-xs text-muted-foreground">Add to home screen for a better experience</p>
        </div>
        <button onClick={handleInstall}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg min-h-[44px] flex items-center gap-1.5">
          <Download className="w-4 h-4" /> Install
        </button>
        <button onClick={handleDismiss} className="p-2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
