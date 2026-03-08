import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getAuthErrorMessage } from "@/lib/authErrors";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role === "admin") navigate("/admin", { replace: true });
  }, [user, role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: data.user.id });
      if (roleData !== "admin") {
        await supabase.auth.signOut();
        throw new Error("You do not have admin access.");
      }
      navigate("/admin");
      toast({ title: "Welcome, Admin!" });
    } catch (err: any) {
      toast({ title: "Login failed", description: getAuthErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src="/skillmitra-logo.png" alt="SkillMitra" className="h-9 w-auto block" style={{ background: 'transparent' }} />
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">Admin</span>
        </Link>
        <form onSubmit={handleLogin} className="bg-card rounded-xl border p-6 space-y-4">
          <h1 className="text-xl font-bold text-foreground">Admin Login</h1>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1" required />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(!!c)} />
              <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Remember me</label>
            </div>
            <Link to="/forgot-password?role=admin" className="text-sm text-primary font-semibold hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
