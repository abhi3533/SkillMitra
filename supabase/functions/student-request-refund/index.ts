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

    // Verify ownership + window
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
    if (enrollment.refund_status !== "none") {
      return new Response(JSON.stringify({ error: `Refund already ${enrollment.refund_status}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!enrollment.refund_eligible_until || new Date(enrollment.refund_eligible_until) < new Date()) {
      return new Response(JSON.stringify({ error: "Refund window (5 days) has expired" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const refundAmount = Number(enrollment.amount_paid || 0);
    const trainerPayout = Number(enrollment.trainer_payout || 0);
    const trainerUserId = (enrollment as any).trainers?.user_id;

    // 1. Debit trainer wallet (atomic — fails if insufficient balance)
    if (trainerUserId && trainerPayout > 0) {
      const { data: debitOk } = await svc.rpc("debit_wallet_atomic", {
        p_user_id: trainerUserId,
        p_amount: trainerPayout,
        p_description: `Refund for "${(enrollment as any).courses?.title || 'course'}" — student cancelled`,
        p_reference_id: `refund_${enrollment_id}`,
      });
      if (!debitOk) {
        return new Response(JSON.stringify({ error: "Trainer wallet has insufficient balance — please contact support" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // 2. Credit student wallet
    await svc.rpc("credit_wallet_atomic", {
      p_user_id: userId,
      p_amount: refundAmount,
      p_description: `Refund for cancelled enrollment — use to book another trainer`,
      p_reference_id: `refund_${enrollment_id}`,
    });

    // 3. Update enrollment + cancel future sessions + free up booked slots
    await svc.from("enrollments").update({
      refund_status: "refunded",
      refund_requested_at: new Date().toISOString(),
      status: "cancelled",
    }).eq("id", enrollment_id);

    await svc.from("course_sessions").update({ status: "cancelled" })
      .eq("enrollment_id", enrollment_id).eq("status", "upcoming");

    await svc.from("trainer_booked_slots").delete().eq("enrollment_id", enrollment_id);

    // 4. Notifications
    await svc.from("notifications").insert([
      {
        user_id: userId,
        title: "Refund Processed ✅",
        body: `₹${refundAmount.toLocaleString("en-IN")} credited to your wallet. Use it to book another trainer.`,
        type: "refund",
        action_url: "/student/wallet",
      },
      ...(trainerUserId ? [{
        user_id: trainerUserId,
        title: "Enrollment Refunded",
        body: `A student cancelled their enrollment within the 5-day refund window. ₹${trainerPayout.toLocaleString("en-IN")} was deducted.`,
        type: "refund",
        action_url: "/trainer/students",
      }] : []),
    ]);

    // 5. Admin activity log
    await svc.from("admin_activity_log").insert({
      event_type: "refund",
      title: "Student Refund Processed",
      description: `Enrollment cancelled within 5-day window — ₹${refundAmount} returned to student wallet`,
      metadata: { enrollment_id, student_user_id: userId, trainer_user_id: trainerUserId, amount: refundAmount, reason: reason || null },
    });

    return new Response(JSON.stringify({ success: true, refunded: refundAmount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Refund error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
