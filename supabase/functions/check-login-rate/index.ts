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
    const minutesLeft = locked ? LOCKOUT_MINUTES : 0;

    if (action === "record") {
      // Purge stale records first (keep table small)
      await serviceClient
        .from("login_attempts")
        .delete()
        .lt("attempted_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

      await serviceClient
        .from("login_attempts")
        .insert({ email: normalizedEmail, ip_address: ip });
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
