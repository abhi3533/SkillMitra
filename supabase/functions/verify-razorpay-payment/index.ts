import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://skillmitra.online",
  "https://www.skillmitra.online",
  "http://localhost:5173", // dev only
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}

async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const data = encoder.encode(`${orderId}|${paymentId}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const expectedSignature = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expectedSignature === signature;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      course_id,
      trainer_id,
      student_id,
      selected_day,
      selected_slot,
      booking_type,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: "Missing payment data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify signature
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const isValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid payment signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the student_id from the request actually belongs to the authenticated user.
    // This prevents IDOR: an attacker cannot supply another user's student_id to
    // create an enrollment on their behalf after a single valid payment.
    const userId = claimsData.claims.sub;
    const { data: studentCheck, error: studentCheckErr } = await serviceClient
      .from("students")
      .select("id, user_id")
      .eq("id", student_id)
      .single();

    if (studentCheckErr || !studentCheck || studentCheck.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update payment record
    await serviceClient
      .from("payments")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "captured",
      })
      .eq("razorpay_order_id", razorpay_order_id);

    // Get course details
    const { data: course } = await serviceClient
      .from("courses")
      .select("*")
      .eq("id", course_id)
      .single();

    if (!course) {
      return new Response(JSON.stringify({ error: "Course not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get platform commission
    const { data: settings } = await serviceClient
      .from("platform_settings")
      .select("commission_percent")
      .limit(1)
      .single();

    const commissionPercent = settings?.commission_percent || 10;
    const courseFee = Number(course.course_fee);
    const platformCommission = Math.round((courseFee * commissionPercent) / 100);
    const trainerPayout = courseFee - platformCommission;

    // Create enrollment
    const { data: enrollment, error: enrollError } = await serviceClient
      .from("enrollments")
      .insert({
        student_id,
        course_id,
        trainer_id,
        status: "active",
        amount_paid: courseFee,
        sessions_total: course.total_sessions || 1,
        start_date: new Date().toISOString().split("T")[0],
        razorpay_payment_id,
        platform_commission: platformCommission,
        trainer_payout: trainerPayout,
      })
      .select()
      .single();

    if (enrollError) {
      console.error("Enrollment error:", enrollError);
      return new Response(JSON.stringify({ error: "Failed to create enrollment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Link payment to enrollment
    await serviceClient
      .from("payments")
      .update({ enrollment_id: enrollment.id })
      .eq("razorpay_order_id", razorpay_order_id);

    // Generate sessions
    const TIME_SLOTS: Record<string, number> = {
      "Early Morning": 6,
      Morning: 9,
      Afternoon: 12,
      Evening: 16,
      Night: 20,
    };

    const hour = TIME_SLOTS[selected_slot] ?? 10;
    const now = new Date();
    const targetDay = selected_day ?? ((now.getDay() + 2) % 7);
    let daysUntil = targetDay - now.getDay();
    if (daysUntil <= 1) daysUntil += 7;

    const firstDate = new Date(now);
    firstDate.setDate(now.getDate() + daysUntil);
    firstDate.setHours(hour, 0, 0, 0);

    const totalSessions = course.total_sessions || 1;
    const sessionsToInsert = [];

    for (let i = 0; i < totalSessions; i++) {
      const sessionDate = new Date(firstDate);
      sessionDate.setDate(firstDate.getDate() + i * 7);

      sessionsToInsert.push({
        enrollment_id: enrollment.id,
        trainer_id,
        title: `Session ${i + 1}: ${course.title}`,
        session_number: i + 1,
        is_trial: false,
        scheduled_at: sessionDate.toISOString(),
        duration_mins: course.session_duration_mins || 60,
        status: "upcoming",
        meet_link: `https://meet.google.com/skillmitra-${course.title.toLowerCase().replace(/\s+/g, "-").slice(0, 15)}-s${i + 1}`,
      });
    }

    await serviceClient.from("course_sessions").insert(sessionsToInsert);

    // Get trainer info for notifications
    const { data: trainer } = await serviceClient
      .from("trainers")
      .select("user_id")
      .eq("id", trainer_id)
      .single();

    const scheduledTimeStr = firstDate.toLocaleString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Notifications
    if (trainer?.user_id) {
      await serviceClient.from("notifications").insert({
        user_id: trainer.user_id,
        title: "New Enrollment! 💰",
        body: `A student enrolled in "${course.title}". Payment of ₹${courseFee.toLocaleString()} confirmed. First session: ${scheduledTimeStr}.`,
        type: "enrollment",
        action_url: "/trainer/sessions",
      });
    }

    await serviceClient.from("notifications").insert({
      user_id: userId,
      title: "Enrollment Confirmed! 🎉",
      body: `Payment successful! You're enrolled in "${course.title}". First session: ${scheduledTimeStr}.`,
      type: "enrollment",
      action_url: "/student/sessions",
    });

    // Update course enrolled count
    await serviceClient
      .from("courses")
      .update({ total_enrolled: (course.total_enrolled || 0) + 1 })
      .eq("id", course_id);

    console.log(JSON.stringify({
      event: "payment_verified",
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      enrollment_id: enrollment.id,
      student_id: student_id,
      course_id: course_id,
      amount: courseFee,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        enrollment_id: enrollment.id,
        message: "Payment verified and enrollment created",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    // Log with payment context so failures are traceable in Supabase logs.
    console.error(JSON.stringify({
      event: "verify_payment_error",
      error: err instanceof Error ? err.message : String(err),
      // razorpay_order_id and userId may be undefined if error happened before parsing
    }));
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
