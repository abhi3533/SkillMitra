import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const { enrollment_id, reason } = await req.json();
    if (!enrollment_id) {
      return new Response(JSON.stringify({ error: "enrollment_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: enrollment, error: eErr } = await svc
      .from("enrollments")
      .select("id, student_id, trainer_id, course_id, amount_paid, trainer_payout, refund_eligible_until, refund_status, status, students!inner(user_id), courses(title), trainers(user_id)")
      .eq("id", enrollment_id)
      .single();

    if (eErr || !enrollment) {
      return new Response(JSON.stringify({ error: "Enrollment not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if ((enrollment as any).students?.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (enrollment.refund_status && enrollment.refund_status !== "none") {
      return new Response(JSON.stringify({ error: `Refund already ${enrollment.refund_status}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!enrollment.refund_eligible_until || new Date(enrollment.refund_eligible_until) < new Date()) {
      return new Response(JSON.stringify({ error: "Refund window (5 days) has expired" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const refundAmount = Number(enrollment.amount_paid || 0);
    const trainerPayout = Number(enrollment.trainer_payout || refundAmount);
    const trainerUserId = (enrollment as any).trainers?.user_id || null;
    const courseTitle = (enrollment as any).courses?.title || "Course";

    // Create refund request (status = pending) — money does NOT move yet
    const { data: requestRow, error: insErr } = await svc.from("refund_requests").insert({
      enrollment_id,
      student_user_id: userId,
      trainer_user_id: trainerUserId,
      course_id: enrollment.course_id,
      course_title: courseTitle,
      amount: refundAmount,
      trainer_payout: trainerPayout,
      reason: reason || null,
      status: "pending",
    }).select("id").single();

    if (insErr) {
      const msg = insErr.message?.includes("uq_refund_pending_per_enrollment")
        ? "A refund request is already pending for this enrollment"
        : insErr.message;
      return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mark enrollment as pending_admin so UI can reflect it
    await svc.from("enrollments").update({
      refund_status: "pending_admin",
      refund_requested_at: new Date().toISOString(),
    }).eq("id", enrollment_id);

    // Lookup names for emails
    const [{ data: studentProfile }, { data: trainerProfile }] = await Promise.all([
      svc.from("profiles").select("full_name, email").eq("id", userId).maybeSingle(),
      trainerUserId
        ? svc.from("profiles").select("full_name, email").eq("id", trainerUserId).maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);

    const studentName = studentProfile?.full_name || "Student";
    const studentEmail = studentProfile?.email;
    const trainerName = trainerProfile?.full_name || "Trainer";
    const trainerEmail = trainerProfile?.email;
    const requestId = requestRow!.id;

    // In-app notifications
    await svc.from("notifications").insert([
      {
        user_id: userId,
        title: "Refund Request Submitted ⏳",
        body: `Your refund request of ₹${refundAmount.toLocaleString("en-IN")} for "${courseTitle}" is awaiting admin review.`,
        type: "refund",
        action_url: "/student/dashboard",
      },
      ...(trainerUserId ? [{
        user_id: trainerUserId,
        title: "Refund Request Received",
        body: `${studentName} has requested a refund for "${courseTitle}". Admin is reviewing — no money has moved yet.`,
        type: "refund",
        action_url: "/trainer/students",
      }] : []),
    ]);

    // Emails: admin + trainer + student confirmation
    const sendEmail = (templateName: string, recipientEmail: string, templateData: any, idemSuffix: string) =>
      svc.functions.invoke("send-transactional-email", {
        body: { templateName, recipientEmail, idempotencyKey: `refund-req-${requestId}-${idemSuffix}`, templateData },
      }).catch((e) => console.error(`${templateName} failed:`, e));

    await Promise.all([
      sendEmail("refund-requested-admin", "contact@skillmitra.online", {
        studentName, trainerName, courseTitle, amount: refundAmount, reason: reason || "", enrollmentId: enrollment_id,
        reviewUrl: "https://skillmitra.online/admin/refunds",
      }, "admin"),
      trainerEmail ? sendEmail("refund-requested-trainer", trainerEmail, {
        trainerName, studentName, courseTitle, amount: refundAmount, reason: reason || "",
      }, "trainer") : Promise.resolve(),
      studentEmail ? sendEmail("refund-requested-student", studentEmail, {
        studentName, courseTitle, amount: refundAmount,
      }, "student") : Promise.resolve(),
    ]);

    // Admin activity log
    await svc.from("admin_activity_log").insert({
      event_type: "refund_requested",
      title: "Refund Request Submitted",
      description: `${studentName} requested ₹${refundAmount} refund for "${courseTitle}"`,
      metadata: { request_id: requestId, enrollment_id, student_user_id: userId, trainer_user_id: trainerUserId, amount: refundAmount, reason: reason || null },
    });

    return new Response(JSON.stringify({ success: true, request_id: requestId, status: "pending" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Refund request error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
