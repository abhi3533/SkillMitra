import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIMEOUT_MS = 10000;

function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("Email sending timed out after 10 seconds")), TIMEOUT_MS)
    ),
  ]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert({ name, email, phone: phone || null, subject, message });

    if (dbError) {
      console.error("DB insert error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to save message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (resendApiKey) {
      try {
        const adminEmailPromise = fetchWithTimeout("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "SkillMitra <contact@skillmitra.online>",
            to: ["contact@skillmitra.online"],
            subject: "New Contact Message from SkillMitra",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a1a; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">New Contact Message</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                  <tr><td style="padding: 8px 0; font-weight: bold; color: #555; width: 120px;">Name:</td><td style="padding: 8px 0; color: #1a1a1a;">${name}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #6366f1;">${email}</a></td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Phone:</td><td style="padding: 8px 0; color: #1a1a1a;">${phone || "Not provided"}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Subject:</td><td style="padding: 8px 0; color: #1a1a1a;">${subject}</td></tr>
                </table>
                <div style="margin-top: 20px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
                  <p style="font-weight: bold; color: #555; margin: 0 0 8px 0;">Message:</p>
                  <p style="color: #1a1a1a; margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
              </div>
            `,
          }),
        });

        const autoReplyPromise = fetchWithTimeout("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "SkillMitra <contact@skillmitra.online>",
            to: [email],
            subject: "Thank you for contacting SkillMitra",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a1a;">Thank you for contacting SkillMitra</h2>
                <p style="color: #333; line-height: 1.6;">Dear ${name},</p>
                <p style="color: #333; line-height: 1.6;">We have received your message and will respond within 24 hours.</p>
                <p style="color: #333; line-height: 1.6;">If you have any urgent concerns, feel free to reach us directly at <a href="mailto:contact@skillmitra.online" style="color: #6366f1;">contact@skillmitra.online</a>.</p>
                <p style="color: #333; line-height: 1.6; margin-top: 24px;">Best regards,<br/>The SkillMitra Team</p>
              </div>
            `,
          }),
        });

        const [adminRes, replyRes] = await Promise.all([adminEmailPromise, autoReplyPromise]);

        if (!adminRes.ok) {
          console.error("Admin email failed:", await adminRes.text());
        }
        if (!replyRes.ok) {
          console.error("Auto-reply email failed:", await replyRes.text());
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError.message);
        // Still return success since the message was saved to DB
      }
    } else {
      console.warn("RESEND_API_KEY not configured, skipping emails");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
