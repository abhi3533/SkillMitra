import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import * as React from "npm:react@18.3.1"
import { renderAsync } from "npm:@react-email/components@0.0.22"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"
import { ContactAdminEmail } from "../_shared/email-templates/contact-admin.tsx"
import { ContactReplyEmail } from "../_shared/email-templates/contact-reply.tsx"

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
        const [adminHtml, replyHtml] = await Promise.all([
          renderAsync(React.createElement(ContactAdminEmail, { name, email, phone: phone || "", subject, message })),
          renderAsync(React.createElement(ContactReplyEmail, { name, subject })),
        ]);

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
            html: adminHtml,
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
            html: replyHtml,
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
