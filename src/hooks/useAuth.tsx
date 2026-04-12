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
  updateProfile: (updates: Record<string, any>) => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null, role: null, loading: true, profile: null, signOut: async () => {}, updateProfile: () => {} });

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

  const updateProfile = useCallback((updates: Record<string, any>) => {
    setProfile((prev: any) => prev ? { ...prev, ...updates } : updates);
  }, []);

  const fetchUserData = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setRole(null);
      setProfile(null);
      // No user — session check is complete, safe to stop showing the loader.
      setLoading(false);
      return;
    }

    // A fetch is already in progress. Do not start a duplicate — the in-progress
    // fetch owns the setLoading(false) call and will fire it when it finishes.
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
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentSession.user.id)
        .maybeSingle();
      setProfile(profileData);
    } finally {
      fetchingRef.current = false;
      // Always mark loading done once the full round-trip completes, regardless
      // of success or error. This is the only place setLoading(false) fires for
      // the authenticated path, preventing the flash where role is still null.
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Track whether getSession has completed — this is the authoritative
    // initial-session source.  onAuthStateChange may fire INITIAL_SESSION with
    // a null session *before* getSession resolves (e.g. during token refresh),
    // so we must NOT set loading=false from the listener until getSession has
    // had a chance to run.
    let getSessionResolved = false;

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
        // Fire and forget — do NOT await inside onAuthStateChange.
        // setLoading(false) is owned by fetchUserData; do not call it here.
        setTimeout(() => { fetchUserData(newSession); }, 0);
      } else if (getSessionResolved) {
        // Only set loading=false for non-session events AFTER getSession has
        // resolved.  Before that, the null session may be transient (token
        // being refreshed) and we must keep the loading state to prevent
        // ProtectedRoute from redirecting to login prematurely.
        setLoading(false);
      }
    });

    // Then restore session. setLoading(false) is owned by fetchUserData; do not
    // chain it here — doing so caused the race where loading became false before
    // fetchUserData finished when fetchingRef blocked a duplicate call.
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      getSessionResolved = true;
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      fetchUserData(existingSession);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  return (
    <AuthContext.Provider value={{ user, session, role, loading, profile, signOut: handleSignOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
