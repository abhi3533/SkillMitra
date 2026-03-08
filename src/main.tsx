import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";

// Startup connection test
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error("[SkillMitra] Startup check failed:", error.message);
  }
}).catch(err => {
  console.error("[SkillMitra] Unreachable at startup:", err);
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
