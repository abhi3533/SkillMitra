import { useState, useEffect, useRef, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "student" | "trainer" | "admin" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  loading: boolean;
  profile: any;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null, role: null, loading: true, profile: null, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  const fetchingRef = useRef(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  const fetchUserData = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setRole(null);
      setProfile(null);
      return;
    }

    // Prevent duplicate concurrent fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: currentSession.user.id });
      if (!roleData) {
        setRole(null);
        setProfile(null);
        return;
      }
      setRole(roleData as AppRole);
      setNeedsRoleSelection(false);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentSession.user.id)
        .maybeSingle();
      setProfile(profileData);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Set up listener FIRST (before getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Synchronous state updates only — no awaiting Supabase calls here
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === "SIGNED_OUT") {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === "TOKEN_REFRESHED" && !newSession) {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (newSession?.user) {
        // Fire and forget — do NOT await inside onAuthStateChange
        setTimeout(() => {
          fetchUserData(newSession).then(() => setLoading(false));
        }, 0);
      } else {
        setLoading(false);
      }
    });

    // Then restore session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      fetchUserData(existingSession).then(() => setLoading(false));
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  return (
    <AuthContext.Provider value={{ user, session, role, loading, profile, signOut: handleSignOut, needsRoleSelection, setNeedsRoleSelection }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
