import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

Deno.serve(async (req) => {
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

    // Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (name.length > 100 || subject.length > 200 || message.length > 5000) {
      return new Response(JSON.stringify({ error: "Input exceeds maximum length" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message.length < 20) {
      return new Response(JSON.stringify({ error: "Message must be at least 20 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Rate limiting: max 3 submissions per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: countError } = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneHourAgo);

    if (countError) {
      console.error("Rate limit check error:", countError);
    } else if (recentCount !== null && recentCount >= 3) {
      return new Response(JSON.stringify({ error: "Too many submissions. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
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
            subject: `New Contact: ${subject}`,
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
          const errText = await adminRes.text();
          console.error("Admin email failed:", errText);
        }
        if (!replyRes.ok) {
          const errText = await replyRes.text();
          console.error("Auto-reply email failed:", errText);
        }
      } catch (emailError: unknown) {
        const msg = emailError instanceof Error ? emailError.message : "Unknown email error";
        console.error("Email sending error:", msg);
      }
    } else {
      console.warn("RESEND_API_KEY not configured, skipping emails");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Contact form error:", msg);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
