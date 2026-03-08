import React from "react";
import { Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[SkillMitra] Unhandled error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center max-w-md px-6">
            <div className="flex items-center justify-center mb-8">
              <span className="inline-flex items-center gap-1.5">
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none"><path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z" fill="#1A56DB"/></svg>
                <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "Inter, system-ui, sans-serif" }}>
                  <span style={{ color: "#0F172A" }}>Skill</span><span style={{ color: "#1A56DB" }}>Mitra</span>
                </span>
              </span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Something Went Wrong</h1>
            <p className="mt-3 text-muted-foreground">
              An unexpected error occurred. Please try refreshing the page or return to the homepage.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh Page
              </Button>
              <Button onClick={() => (window.location.href = "/")} className="gap-2">
                <Home className="w-4 h-4" /> Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
