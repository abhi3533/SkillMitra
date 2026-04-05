import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Check, ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { timeAgoIST } from "@/lib/dateUtils";

const getNotificationRoute = (n: any, role: string | null): string | null => {
  // Use action_url from DB if set
  if (n.action_url) return n.action_url;

  const title = (n.title || "").toLowerCase();
  const type = (n.type || "").toLowerCase();

  if (role === "trainer") {
    if (title.includes("course approved") || title.includes("course changes requested")) return "/trainer/courses";
    if (title.includes("you're approved") || title.includes("you are approved")) return "/trainer/courses";
    if (title.includes("application rejected") || title.includes("rejected")) return "/trainer/onboarding";
    if (title.includes("referral")) return "/trainer/referrals";
    if (title.includes("withdrawal") || title.includes("payout")) return "/trainer/wallet";
    return "/trainer/dashboard";
  }

  if (role === "admin") {
    if (title.includes("trainer application") || title.includes("new trainer")) return "/admin/trainers";
    if (title.includes("course submitted") || title.includes("new course")) return "/admin/courses";
    if (title.includes("withdrawal") || title.includes("payout")) return "/admin/payouts";
    if (title.includes("referral")) return "/admin/referrals";
    return "/admin";
  }

  // student / default
  if (title.includes("referral")) return "/student/referrals";
  if (title.includes("enrollment")) return "/student/dashboard";
  return "/student/dashboard";
};

const Notifications = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setNotifications(data || []);
      setLoading(false);
    };
    fetch();

    // Realtime
    const channel = supabase.channel("notifs").on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
      setNotifications(prev => [payload.new as any, ...prev]);
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
    }
    const route = getNotificationRoute(n, role);
    if (route) navigate(route);
  };

  const backPath = role === "trainer" ? "/trainer/dashboard" : role === "admin" ? "/admin" : "/student/dashboard";
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const timeAgo = timeAgoIST;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b px-4 lg:px-8 h-16 flex items-center gap-4">
        <Link to={backPath}><ArrowLeft className="w-5 h-5 text-muted-foreground" /></Link>
        <h1 className="text-lg font-bold text-foreground">Notifications</h1>
        {unreadCount > 0 && <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">{unreadCount}</span>}
        <div className="flex-1" />
        <Link to="/notification-preferences">
          <Button variant="ghost" size="sm" className="text-xs gap-1">
            <Settings className="w-3.5 h-3.5" /> Preferences
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
          <Check className="w-3 h-3 mr-1" />Mark all read
        </Button>
      </header>

      <div className="max-w-2xl mx-auto p-4 lg:p-8">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-card rounded-xl border animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center mt-16">
            <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No notifications</h3>
            <p className="mt-2 text-muted-foreground">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} onClick={() => handleNotificationClick(n)}
                className={`p-4 rounded-xl border cursor-pointer transition-colors hover:bg-accent/50 ${n.is_read ? "bg-card" : "bg-primary/5 border-l-4 border-l-primary"}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
