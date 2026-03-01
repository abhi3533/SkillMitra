import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";

// Startup connection test
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error("[SkillMitra] Supabase startup check FAILED:", error.message);
  } else {
    console.log("[SkillMitra] Supabase OK | URL:", import.meta.env.VITE_SUPABASE_URL, "| Session:", !!data.session);
  }
}).catch(err => {
  console.error("[SkillMitra] Supabase unreachable at startup:", err);
});

createRoot(document.getElementById("root")!).render(<App />);
