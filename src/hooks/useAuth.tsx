import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "student" | "trainer" | "admin" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  loading: boolean;
  profile: any;
  signOut: () => Promise<void>;
  needsRoleSelection: boolean;
  setNeedsRoleSelection: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null, role: null, loading: true, profile: null, signOut: async () => {}, needsRoleSelection: false, setNeedsRoleSelection: () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  const fetchUserData = async (session: Session | null) => {
    if (session?.user) {
      const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: session.user.id });
      setRole(roleData as AppRole);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setProfile(profileData);
    } else {
      setRole(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_OUT") {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === "TOKEN_REFRESHED" && !session) {
        // Session expired — token refresh failed
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        await fetchUserData(session);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      await fetchUserData(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, role, loading, profile, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
