import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";

const StudentLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connStatus, setConnStatus] = useState<"checking" | "connected" | "failed">("checking");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Test Supabase connectivity on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          console.error("[SkillMitra] Supabase auth error:", error.message);
          setConnStatus("failed");
        } else {
          console.log("[SkillMitra] Supabase connection OK — URL:", import.meta.env.VITE_SUPABASE_URL);
          setConnStatus("connected");
        }
      } catch (err) {
        console.error("[SkillMitra] Supabase unreachable:", err);
        setConnStatus("failed");
      }
    };
    testConnection();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check role and redirect accordingly
      const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: data.user.id });
      
      if (roleData === "trainer") {
        navigate("/trainer/dashboard");
      } else if (roleData === "admin") {
        navigate("/admin");
      } else {
        navigate("/student/dashboard");
      }
      toast({ title: "Welcome back!" });
    } catch (err: any) {
      toast({ title: "Login failed", description: getAuthErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-12">
        <div className="max-w-md">
          <Link to="/" className="flex items-center mb-12">
            <span className="text-[22px] font-bold" style={{ fontFamily: "Inter, sans-serif" }}>
              <span style={{ color: "#FFFFFF" }}>Skill</span><span style={{ color: "#6EA8FE" }}>Mitra</span>
            </span>
          </Link>
          <h2 className="text-3xl font-bold text-primary-foreground">Welcome back, learner!</h2>
          <p className="mt-4 text-primary-foreground/60 leading-relaxed">Continue your learning journey with India's best trainers.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center">
              <span className="text-[22px] font-bold" style={{ fontFamily: "Inter, sans-serif" }}>
                <span style={{ color: "#0F172A" }}>Skill</span><span style={{ color: "#1A56DB" }}>Mitra</span>
              </span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-foreground">Student Login</h1>
          <p className="mt-2 text-muted-foreground">Enter your credentials to access your dashboard</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5 h-11" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 hero-gradient font-semibold border-0">
              {loading ? "Signing in..." : "Sign In"} {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>

            {/* Connection status indicator */}
            <div className="flex items-center justify-center gap-2 text-xs">
              {connStatus === "checking" && <span className="text-muted-foreground">Checking connection...</span>}
              {connStatus === "connected" && (
                <span className="text-green-600 flex items-center gap-1"><Wifi className="w-3 h-3" /> Connected to server</span>
              )}
              {connStatus === "failed" && (
                <button type="button" onClick={() => { setConnStatus("checking"); supabase.auth.getSession().then(({ error }) => setConnStatus(error ? "failed" : "connected")).catch(() => setConnStatus("failed")); }}
                  className="text-destructive flex items-center gap-1 hover:underline">
                  <WifiOff className="w-3 h-3" /> Connection failed — tap to retry
                </button>
              )}
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/student/signup" className="text-primary font-semibold hover:underline">Sign up free</Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Are you a trainer? <Link to="/trainer/login" className="text-accent font-semibold hover:underline">Trainer Login</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentLogin;
