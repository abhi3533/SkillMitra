import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 15;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email } = await req.json();

    if (!email || !["check", "record", "clear"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const windowStart = new Date(
      Date.now() - WINDOW_MINUTES * 60 * 1000
    ).toISOString();

    if (action === "clear") {
      // Only admins can clear rate limits — verify caller identity and role
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user: callerUser }, error: authErr } = await anonClient.auth.getUser();
      if (authErr || !callerUser) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roleRow } = await serviceClient
        .from("user_roles")
        .select("role")
        .eq("user_id", callerUser.id)
        .maybeSingle();
      if (roleRow?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await serviceClient
        .from("login_attempts")
        .delete()
        .eq("email", normalizedEmail);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count recent attempts by email OR IP
    const { count: emailCount } = await serviceClient
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("email", normalizedEmail)
      .gte("attempted_at", windowStart);

    const { count: ipCount } = ip !== "unknown"
      ? await serviceClient
          .from("login_attempts")
          .select("id", { count: "exact", head: true })
          .eq("ip_address", ip)
          .gte("attempted_at", windowStart)
      : { count: 0 };

    const attempts = Math.max(emailCount ?? 0, ipCount ?? 0);
    const locked = attempts >= MAX_ATTEMPTS;

    // Calculate actual minutes remaining based on when the oldest attempt in the
    // window will expire, not a static LOCKOUT_MINUTES. This ensures the countdown
    // decreases and the lockout genuinely lifts after 15 minutes.
    let minutesLeft = 0;
    if (locked) {
      const { data: oldest } = await serviceClient
        .from("login_attempts")
        .select("attempted_at")
        .eq("email", normalizedEmail)
        .gte("attempted_at", windowStart)
        .order("attempted_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (oldest?.attempted_at) {
        const expiresAt =
          new Date(oldest.attempted_at).getTime() +
          LOCKOUT_MINUTES * 60 * 1000;
        minutesLeft = Math.max(1, Math.ceil((expiresAt - Date.now()) / 60_000));
      } else {
        minutesLeft = LOCKOUT_MINUTES;
      }
    }

    if (action === "record") {
      // Purge stale records first (keep table small)
      await serviceClient
        .from("login_attempts")
        .delete()
        .lt("attempted_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

      // Do NOT insert a new record when already locked — doing so would push the
      // oldest-attempt timestamp forward and extend the lockout indefinitely.
      if (!locked) {
        await serviceClient
          .from("login_attempts")
          .insert({ email: normalizedEmail, ip_address: ip });
      }
    }

    return new Response(JSON.stringify({ locked, minutesLeft, attempts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-login-rate error:", err);
    // Fail open — never block a legitimate user due to our own error
    return new Response(JSON.stringify({ locked: false, minutesLeft: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
