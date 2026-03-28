import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"

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

    const contactId = crypto.randomUUID();
    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert({ id: contactId, name, email, phone: phone || null, subject, message });

    if (dbError) {
      console.error("DB insert error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to save message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send confirmation email to the user via transactional email system
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: email,
          idempotencyKey: `contact-confirm-${contactId}`,
          templateData: { name, subject },
        },
      });
    } catch (emailErr) {
      console.error("Contact confirmation email failed:", emailErr);
    }

    // Send admin notification
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-admin-notify",
          recipientEmail: "contact@skillmitra.online",
          idempotencyKey: `contact-admin-${contactId}`,
          templateData: { name, email, phone: phone || "", subject, message },
        },
      });
    } catch (emailErr) {
      console.error("Admin notification email failed:", emailErr);
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
