import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"

const TIMEOUT_MS = 10000;

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c)
  );
}

function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("Email sending timed out after 10 seconds")), TIMEOUT_MS)
    ),
  ]);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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
            subject: `New Contact: ${escapeHtml(subject)}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
                <div style="background: #1A56DB; padding: 24px 32px; text-align: center;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Skill<span style="color: rgba(255,255,255,0.8);">Mitra</span></h2>
                  <p style="margin: 4px 0 0; font-size: 12px; color: rgba(255,255,255,0.7);">Contact Form Submission</p>
                </div>
                <div style="padding: 28px 32px;">
                  <h3 style="margin: 0 0 16px; font-size: 18px; color: #0F172A;">New Message Received</h3>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
                    <tr><td style="padding: 8px 0; font-weight: 600; color: #64748B; width: 100px; vertical-align: top;">Name:</td><td style="padding: 8px 0; color: #0F172A;">${escapeHtml(name)}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: 600; color: #64748B; vertical-align: top;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #1A56DB;">${escapeHtml(email)}</a></td></tr>
                    <tr><td style="padding: 8px 0; font-weight: 600; color: #64748B; vertical-align: top;">Phone:</td><td style="padding: 8px 0; color: #0F172A;">${escapeHtml(phone || "Not provided")}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: 600; color: #64748B; vertical-align: top;">Subject:</td><td style="padding: 8px 0; color: #0F172A;">${escapeHtml(subject)}</td></tr>
                  </table>
                  <div style="margin-top: 16px; padding: 16px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <p style="font-weight: 600; color: #64748B; margin: 0 0 8px; font-size: 13px;">Message:</p>
                    <p style="color: #0F172A; margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${escapeHtml(message)}</p>
                  </div>
                </div>
                <div style="padding: 16px 32px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="font-size: 12px; color: #9ca3af; margin: 0;">SkillMitra · <a href="https://skillmitra.online" style="color: #9ca3af;">skillmitra.online</a></p>
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
            subject: "We've received your message — SkillMitra",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
                <div style="background: #1A56DB; padding: 24px 32px; text-align: center;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Skill<span style="color: rgba(255,255,255,0.8);">Mitra</span></h2>
                  <p style="margin: 4px 0 0; font-size: 12px; color: rgba(255,255,255,0.7);">Learn. Grow. Excel.</p>
                </div>
                <div style="padding: 32px 32px 24px;">
                  <h3 style="margin: 0 0 16px; font-size: 20px; color: #0F172A;">Thanks for reaching out, ${escapeHtml(name)}!</h3>
                  <p style="font-size: 15px; color: #64748B; line-height: 1.6; margin: 0 0 16px;">We've received your message and will get back to you within <strong>24 hours</strong>.</p>
                  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
                    <p style="font-size: 13px; color: #1A56DB; margin: 0; font-weight: 600;">Your subject: ${escapeHtml(subject)}</p>
                  </div>
                  <p style="font-size: 14px; color: #64748B; line-height: 1.6; margin: 16px 0 0;">For urgent matters, email us directly at <a href="mailto:contact@skillmitra.online" style="color: #1A56DB;">contact@skillmitra.online</a>.</p>
                </div>
                <div style="padding: 16px 32px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="font-size: 12px; color: #9ca3af; margin: 0;">© ${new Date().getFullYear()} SkillMitra · <a href="https://skillmitra.online" style="color: #9ca3af;">skillmitra.online</a> · <a href="https://skillmitra.online/privacy" style="color: #9ca3af;">Privacy</a></p>
                </div>
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
