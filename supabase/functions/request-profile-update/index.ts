import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { field, reason } = await req.json();
    if (!field || !reason) {
      return new Response(JSON.stringify({ error: "Field and reason are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get trainer + profile info
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const [{ data: trainer }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("trainers").select("id, approval_status").eq("user_id", user.id).maybeSingle(),
      supabaseAdmin.from("profiles").select("full_name, email, phone").eq("id", user.id).maybeSingle(),
    ]);

    if (!trainer || trainer.approval_status !== "approved") {
      return new Response(JSON.stringify({ error: "Only approved trainers can request updates" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trainerName = profile?.full_name || "Unknown Trainer";
    const trainerEmail = profile?.email || user.email || "";

    // Send email to admin
    const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 24px; font-weight: 700;">
            <span style="color: #0F172A;">Skill</span><span style="color: #1A56DB;">Mitra</span>
          </span>
        </div>
        <h2 style="color: #0F172A; font-size: 18px;">Profile Update Request</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Trainer</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${trainerName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Email</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${trainerEmail}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Field to Update</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${field}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Reason</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${reason}</td></tr>
        </table>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px; text-align: center;">
          Questions? Reply to this email or contact us at contact@skillmitra.online | skillmitra.online<br/>
          © 2026 Learnvate Solutions. All rights reserved.
        </p>
      </div>
    `;

    if (resendApiKey && lovableApiKey) {
      await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
          "X-Connection-Api-Key": resendApiKey,
        },
        body: JSON.stringify({
          from: "SkillMitra <notifications@notify.skillmitra.online>",
          to: ["contact@skillmitra.online"],
          subject: `Profile Update Request — ${trainerName} wants to change ${field}`,
          html: emailHtml,
        }),
      });
    }

    // Create notification for admins
    const { data: admins } = await supabaseAdmin.from("admins").select("user_id").eq("is_active", true);
    if (admins && admins.length > 0) {
      const notifs = admins.map((a: any) => ({
        user_id: a.user_id,
        title: "Profile Update Request",
        body: `${trainerName} wants to update their ${field}`,
        type: "profile_update_request",
        action_url: "/admin/trainers",
      }));
      await supabaseAdmin.from("notifications").insert(notifs);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
