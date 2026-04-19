import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { formatIST } from "../_shared/dateUtils.ts";
import { isHourInBands, buildWeeklySessionDates, toLocalDateString } from "../_shared/slotBands.ts";

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
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
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
      selected_date,   // YYYY-MM-DD (course start date or later)
      selected_hour,   // 0–23, must fall within course.available_slot_bands
      booking_type,
    } = await req.json();

    // Free-enrollment path: order_id begins with "free_" and there's no Razorpay signature
    const isFreeEnrollment = typeof razorpay_order_id === "string" && razorpay_order_id.startsWith("free_");

    if (!razorpay_order_id || (!isFreeEnrollment && (!razorpay_payment_id || !razorpay_signature))) {
      return new Response(JSON.stringify({ error: "Missing payment data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify signature only for paid Razorpay flow
    if (!isFreeEnrollment) {
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
    const userId = claimsData.user.id;
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

    // Update payment record (skip signature update for free enrollments)
    if (!isFreeEnrollment) {
      await serviceClient
        .from("payments")
        .update({
          razorpay_payment_id,
          razorpay_signature,
          status: "captured",
        })
        .eq("razorpay_order_id", razorpay_order_id);
    }

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

    // ── SLOT VALIDATION (before any state mutation) ──
    const totalSessionsForBooking = course.total_sessions || 1;
    const allowedBands: string[] = Array.isArray(course.available_slot_bands) && course.available_slot_bands.length > 0
      ? course.available_slot_bands
      : ["morning", "day", "evening"];

    if (selected_date == null || selected_hour == null || typeof selected_hour !== "number") {
      return new Response(JSON.stringify({ error: "Please select a valid date and time slot." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Date >= course_start_date (if set) and >= today
    const todayStr = toLocalDateString(new Date());
    if (selected_date < todayStr) {
      return new Response(JSON.stringify({ error: "Selected date is in the past." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (course.course_start_date && selected_date < course.course_start_date) {
      return new Response(JSON.stringify({ error: `Course starts on ${course.course_start_date}. Pick a later date.` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hour must fall in an allowed band
    if (!isHourInBands(selected_hour, allowedBands)) {
      return new Response(JSON.stringify({ error: "Selected time is outside the trainer's available slots." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build all weekly session dates and check none are already booked
    const [yy, mm, dd] = selected_date.split("-").map(Number);
    const firstSessionDate = new Date(yy, mm - 1, dd, selected_hour, 0, 0, 0);
    const allSessionDates = buildWeeklySessionDates({
      startDate: firstSessionDate,
      weekday: firstSessionDate.getDay(),
      hour: selected_hour,
      count: totalSessionsForBooking,
    });
    const allDateStrs = allSessionDates.map(toLocalDateString);

    const { data: clashes } = await serviceClient
      .from("trainer_booked_slots")
      .select("slot_date")
      .eq("trainer_id", trainer_id)
      .eq("slot_hour", selected_hour)
      .in("slot_date", allDateStrs);

    if (clashes && clashes.length > 0) {
      return new Response(JSON.stringify({
        error: `Time slot already booked on ${clashes.map(c => c.slot_date).join(", ")}. Please pick another slot.`,
      }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: paymentRow } = await serviceClient
      .from("payments")
      .select("amount")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();
    const amountChargedRzp = Number(paymentRow?.amount || 0);

    // Get platform commission
    const { data: settings } = await serviceClient
      .from("platform_settings")
      .select("commission_percent")
      .limit(1)
      .single();

    const commissionPercent = settings?.commission_percent || 10;
    const courseFee = Number(course.course_fee);

    // Trainer is paid based on the FULL course fee (discounts are platform-funded)
    const platformCommission = Math.round((courseFee * commissionPercent) / 100);
    const trainerPayout = courseFee - platformCommission;

    // Recompute referral discount + wallet deduction server-side
    const { data: studentRow } = await serviceClient
      .from("students")
      .select("referred_by")
      .eq("id", student_id)
      .single();

    const { count: priorActive } = await serviceClient
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student_id)
      .eq("status", "active");

    const referralDiscount = (studentRow?.referred_by && (priorActive || 0) === 0) ? 100 : 0;
    const walletDeduction = Math.max(0, courseFee - referralDiscount - amountChargedRzp);
    const studentNetPaid = amountChargedRzp + walletDeduction;

    // Create enrollment
    const { data: enrollment, error: enrollError } = await serviceClient
      .from("enrollments")
      .insert({
        student_id,
        course_id,
        trainer_id,
        status: "active",
        amount_paid: studentNetPaid,
        sessions_total: course.total_sessions || 1,
        start_date: new Date().toISOString().split("T")[0],
        razorpay_payment_id: isFreeEnrollment ? null : razorpay_payment_id,
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

    // Debit student wallet if used (atomic, idempotent on enrollment.id)
    if (walletDeduction > 0) {
      const { data: debitOk, error: debitErr } = await serviceClient.rpc("debit_wallet_atomic", {
        p_user_id: userId,
        p_amount: walletDeduction,
        p_description: `Wallet used for "${course.title}" enrollment`,
        p_reference_id: enrollment.id,
      });
      if (debitErr || !debitOk) {
        console.error("Wallet debit failed (non-blocking):", debitErr, "ok=", debitOk);
      }
    }

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

    const scheduledTimeStr = formatIST(firstDate.toISOString());

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

    // Credit trainer wallet via atomic RPC (auto-creates wallet, idempotent on enrollment.id)
    if (trainer?.user_id && trainerPayout > 0) {
      const { error: trainerCreditErr } = await serviceClient.rpc("credit_wallet_atomic", {
        p_user_id: trainer.user_id,
        p_amount: trainerPayout,
        p_description: `Earning from "${course.title}" enrollment`,
        p_reference_id: enrollment.id,
      });
      if (trainerCreditErr) console.error("Trainer wallet credit failed (non-blocking):", trainerCreditErr);
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
      const { data: studentProfile } = await serviceClient.from("profiles").select("full_name, email").eq("id", userId).single();
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
