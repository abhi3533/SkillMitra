import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">S</span>
          </div>
          <span className="text-xl font-bold text-foreground">SkillMitra <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Admin</span></span>
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
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Signing in..." : "Sign In"}</Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
