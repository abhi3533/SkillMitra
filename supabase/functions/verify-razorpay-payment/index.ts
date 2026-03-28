import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://skillmitra.online",
  "https://www.skillmitra.online",
  "http://localhost:5173",
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

async function sendEmail(serviceClient: any, type: string, to: string, data: Record<string, any>) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ type, to, data }),
    });
  } catch (err) {
    console.error(`Email send error (${type}):`, err);
  }
}

async function logActivity(serviceClient: any, eventType: string, title: string, description: string, metadata: Record<string, any> = {}) {
  try {
    await serviceClient.from("admin_activity_log").insert({
      event_type: eventType,
      title,
      description,
      metadata,
    });
  } catch (err) {
    console.error("Activity log error:", err);
  }
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

    // Idempotency guard
    const { data: existingPayment } = await serviceClient
      .from("payments")
      .select("status, enrollment_id")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (existingPayment?.status === "captured" && existingPayment?.enrollment_id) {
      return new Response(
        JSON.stringify({
          success: true,
          enrollment_id: existingPayment.enrollment_id,
          message: "Payment already processed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify student ownership
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

    // Generate real Jitsi meet links
    function generateMeetLink(courseTitle: string, sessionNumber?: number): string {
      const slug = courseTitle.replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "-").toLowerCase().slice(0, 30);
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const sessionTag = sessionNumber ? `-s${sessionNumber}` : "";
      return `https://meet.jit.si/skillmitra-${slug}${sessionTag}-${uniqueId}`;
    }

    const firstMeetLink = generateMeetLink(course.title, 1);

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
        meet_link: generateMeetLink(course.title, i + 1),
      });
    }

    await serviceClient.from("course_sessions").insert(sessionsToInsert);

    // Get trainer + student info for emails
    const [{ data: trainer }, { data: studentProfile }, { data: trainerProfile }] = await Promise.all([
      serviceClient.from("trainers").select("user_id").eq("id", trainer_id).single(),
      serviceClient.from("profiles").select("full_name, email").eq("id", userId).single(),
      trainer_id ? serviceClient.from("trainers").select("user_id").eq("id", trainer_id).single().then(async (r) => {
        if (r.data?.user_id) {
          return serviceClient.from("profiles").select("full_name, email").eq("id", r.data.user_id).single();
        }
        return { data: null };
      }) : { data: null },
    ]);

    const scheduledTimeStr = firstDate.toLocaleString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    // In-app notifications
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

    // ==================== SEND EMAILS ====================

    // Email to STUDENT
    if (studentProfile?.email) {
      await sendEmail(serviceClient, "enrollment_confirmed_student", studentProfile.email, {
        name: studentProfile.full_name || "Student",
        course_name: course.title,
        trainer_name: trainerProfile?.full_name || "Trainer",
        total_sessions: totalSessions,
        first_session: scheduledTimeStr,
        amount_paid: courseFee.toLocaleString(),
        meet_link: firstMeetLink,
        payment_id: razorpay_payment_id,
      });
    }

    // Email to TRAINER
    if (trainerProfile?.email) {
      await sendEmail(serviceClient, "enrollment_confirmed_trainer", trainerProfile.email, {
        trainer_name: trainerProfile.full_name || "Trainer",
        course_name: course.title,
        student_name: studentProfile?.full_name || "Student",
        trainer_payout: trainerPayout.toLocaleString(),
        first_session: scheduledTimeStr,
        total_sessions: totalSessions,
      });
    }

    // Email to ADMIN
    const { data: adminUsers } = await serviceClient.from("admins").select("email").eq("is_active", true).limit(3);
    for (const admin of (adminUsers || [])) {
      if (admin.email) {
        await sendEmail(serviceClient, "enrollment_confirmed_admin", admin.email, {
          student_name: studentProfile?.full_name || "Student",
          trainer_name: trainerProfile?.full_name || "Trainer",
          course_name: course.title,
          amount_paid: courseFee.toLocaleString(),
          platform_commission: platformCommission.toLocaleString(),
          trainer_payout: trainerPayout.toLocaleString(),
          payment_id: razorpay_payment_id,
        });
      }
    }

    // Log admin activity
    await logActivity(serviceClient, "payment", "New Payment Received", 
      `${studentProfile?.full_name || 'Student'} enrolled in "${course.title}" — ₹${courseFee.toLocaleString()}`,
      { student_id, trainer_id, course_id, amount: courseFee, commission: platformCommission, enrollment_id: enrollment.id }
    );

    // Credit trainer earnings
    const { data: trainerData } = await serviceClient.from("trainers").select("total_earnings, available_balance, total_students").eq("id", trainer_id).single();
    if (trainerData) {
      await serviceClient.from("trainers").update({
        total_earnings: Number(trainerData.total_earnings || 0) + trainerPayout,
        available_balance: Number(trainerData.available_balance || 0) + trainerPayout,
        total_students: Number(trainerData.total_students || 0) + 1,
      }).eq("id", trainer_id);
    }

    // Credit trainer wallet
    const { data: trainerWallet } = await serviceClient.from("wallets").select("id, balance, total_earned").eq("user_id", trainer?.user_id).single();
    if (trainerWallet) {
      await serviceClient.from("wallets").update({
        balance: Number(trainerWallet.balance) + trainerPayout,
        total_earned: Number(trainerWallet.total_earned) + trainerPayout,
        last_updated: new Date().toISOString(),
      }).eq("id", trainerWallet.id);

      await serviceClient.from("wallet_transactions").insert({
        wallet_id: trainerWallet.id,
        user_id: trainer?.user_id,
        type: "credit",
        amount: trainerPayout,
        description: `Earning from "${course.title}" enrollment`,
        reference_id: enrollment.id,
      });
    }

    // Increment enrolled count
    await serviceClient.rpc("increment_course_enrolled", { course_id_param: course_id });

    // Trigger student referral completion
    try {
      const { data: studentData } = await serviceClient
        .from("students")
        .select("referred_by")
        .eq("id", student_id)
        .single();

      if (studentData?.referred_by) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${supabaseUrl}/functions/v1/complete-referral`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ student_id, course_value: courseFee }),
        });
      }
    } catch (refErr) {
      console.error("Referral completion error (non-blocking):", refErr);
    }

    // Send enrollment confirmation email
    try {
      const { data: studentProfile } = await serviceClient.from("profiles").select("full_name, email").eq("id", studentUserId).single();
      const { data: trainerProfile } = await serviceClient.from("profiles").select("full_name").eq("id", trainer?.user_id).single();
      if (studentProfile?.email) {
        await serviceClient.functions.invoke("send-transactional-email", {
          body: {
            templateName: "enrollment-confirmation",
            recipientEmail: studentProfile.email,
            idempotencyKey: `enrollment-confirm-${enrollment.id}`,
            templateData: {
              studentName: studentProfile.full_name || "",
              courseName: course.title,
              trainerName: trainerProfile?.full_name || "",
              amountPaid: courseFee.toLocaleString("en-IN"),
            },
          },
        });
      }
    } catch (emailErr) {
      console.error("Enrollment confirmation email failed (non-blocking):", emailErr);
    }

    console.log(JSON.stringify({
      event: "payment_verified",
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      enrollment_id: enrollment.id,
      student_id,
      course_id,
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
    console.error(JSON.stringify({
      event: "verify_payment_error",
      error: err instanceof Error ? err.message : String(err),
    }));
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
