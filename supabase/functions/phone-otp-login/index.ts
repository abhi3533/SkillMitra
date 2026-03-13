import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, accessToken } = await req.json();

    if (!phone || !accessToken) {
      return new Response(JSON.stringify({ error: "phone and accessToken are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the MSG91 access token server-side
    const msg91AuthKey = Deno.env.get("MSG91_AUTH_KEY");
    if (!msg91AuthKey) {
      console.error("MSG91_AUTH_KEY secret is not set");
      return new Response(JSON.stringify({ error: "OTP service misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verifyUrl = `https://api.msg91.com/api/v5/widget/verifyAccessToken?authkey=${msg91AuthKey}&access-token=${encodeURIComponent(accessToken)}`;
    const verifyResp = await fetch(verifyUrl);
    const verifyData = await verifyResp.json();

    if (verifyData.type !== "success") {
      return new Response(JSON.stringify({ error: "Phone verification token is invalid or expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the user by phone number
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, email")
      .eq("phone", phone)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      throw profileError;
    }

    if (!profile) {
      return new Response(JSON.stringify({ error: "No account found with this phone number. Please sign up first." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a magic-link sign-in token for the user
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: profile.email,
    });

    if (linkError || !linkData) {
      console.error("generateLink error:", linkError);
      throw linkError || new Error("Failed to generate login token");
    }

    return new Response(JSON.stringify({
      token_hash: linkData.properties.hashed_token,
      email: profile.email,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("phone-otp-login error:", err);
    return new Response(JSON.stringify({ error: err.message || "Login failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
