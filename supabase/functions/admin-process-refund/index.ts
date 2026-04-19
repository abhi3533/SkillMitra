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
    const adminUserId = userData.user.id;

    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Verify admin role
    const { data: roleRow } = await svc.from("user_roles").select("role").eq("user_id", adminUserId).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { request_id, action, admin_notes } = await req.json();
    if (!request_id || !["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "request_id and valid action (approve|reject) required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: rr, error: rErr } = await svc.from("refund_requests").select("*").eq("id", request_id).single();
    if (rErr || !rr) {
      return new Response(JSON.stringify({ error: "Refund request not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (rr.status !== "pending") {
      return new Response(JSON.stringify({ error: `Request already ${rr.status}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Lookup names + emails
    const [{ data: studentProfile }, { data: trainerProfile }] = await Promise.all([
      svc.from("profiles").select("full_name, email").eq("id", rr.student_user_id).maybeSingle(),
      rr.trainer_user_id
        ? svc.from("profiles").select("full_name, email").eq("id", rr.trainer_user_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);
    const studentName = studentProfile?.full_name || "Student";
    const studentEmail = studentProfile?.email;
    const trainerName = trainerProfile?.full_name || "Trainer";
    const trainerEmail = trainerProfile?.email;

    const sendEmail = (templateName: string, recipientEmail: string, templateData: any, idemSuffix: string) =>
      svc.functions.invoke("send-transactional-email", {
        body: { templateName, recipientEmail, idempotencyKey: `refund-${action}-${request_id}-${idemSuffix}`, templateData },
      }).catch((e) => console.error(`${templateName} failed:`, e));

    if (action === "reject") {
      await svc.from("refund_requests").update({
        status: "rejected",
        admin_notes: admin_notes || null,
        processed_by: adminUserId,
        processed_at: new Date().toISOString(),
      }).eq("id", request_id);

      // Reset enrollment refund_status so the 5-day window can resume (or stays expired)
      await svc.from("enrollments").update({
        refund_status: "none",
        refund_requested_at: null,
      }).eq("id", rr.enrollment_id);

      await svc.from("notifications").insert({
        user_id: rr.student_user_id,
        title: "Refund Request Declined",
        body: admin_notes ? `Reason: ${admin_notes}` : `Your refund for "${rr.course_title}" was not approved.`,
        type: "refund",
        action_url: "/student/dashboard",
      });

      if (studentEmail) {
        await sendEmail("refund-rejected-student", studentEmail, {
          studentName, courseTitle: rr.course_title, amount: rr.amount, adminNotes: admin_notes || "",
        }, "student");
      }

      await svc.from("admin_activity_log").insert({
        event_type: "refund_rejected",
        title: "Refund Request Rejected",
        description: `Rejected ₹${rr.amount} refund for ${studentName} — "${rr.course_title}"`,
        metadata: { request_id, enrollment_id: rr.enrollment_id, admin_notes, processed_by: adminUserId },
      });

      return new Response(JSON.stringify({ success: true, status: "rejected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // APPROVE: Debit trainer wallet, credit student wallet, cancel sessions, free slots
    const refundAmount = Number(rr.amount || 0);
    const trainerPayout = Number(rr.trainer_payout || refundAmount);

    if (rr.trainer_user_id && trainerPayout > 0) {
      const { data: debitOk } = await svc.rpc("debit_wallet_atomic", {
        p_user_id: rr.trainer_user_id,
        p_amount: trainerPayout,
        p_description: `Refund approved for "${rr.course_title}" — student request`,
        p_reference_id: `refund_approved_${request_id}`,
      });
      if (!debitOk) {
        return new Response(JSON.stringify({ error: "Trainer wallet has insufficient balance — cannot approve refund" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    await svc.rpc("credit_wallet_atomic", {
      p_user_id: rr.student_user_id,
      p_amount: refundAmount,
      p_description: `Refund approved for "${rr.course_title}"`,
      p_reference_id: `refund_approved_${request_id}`,
    });

    await svc.from("enrollments").update({
      refund_status: "refunded",
      status: "cancelled",
    }).eq("id", rr.enrollment_id);

    await svc.from("course_sessions").update({ status: "cancelled" })
      .eq("enrollment_id", rr.enrollment_id).eq("status", "upcoming");

    await svc.from("trainer_booked_slots").delete().eq("enrollment_id", rr.enrollment_id);

    await svc.from("refund_requests").update({
      status: "approved",
      admin_notes: admin_notes || null,
      processed_by: adminUserId,
      processed_at: new Date().toISOString(),
    }).eq("id", request_id);

    await svc.from("notifications").insert([
      {
        user_id: rr.student_user_id,
        title: "Refund Approved ✅",
        body: `₹${refundAmount.toLocaleString("en-IN")} credited to your wallet. Use it to book another trainer.`,
        type: "refund",
        action_url: "/student/wallet",
      },
      ...(rr.trainer_user_id ? [{
        user_id: rr.trainer_user_id,
        title: "Refund Approved by Admin",
        body: `₹${trainerPayout.toLocaleString("en-IN")} was deducted from your wallet for the refund of "${rr.course_title}".`,
        type: "refund",
        action_url: "/trainer/wallet",
      }] : []),
    ]);

    await Promise.all([
      studentEmail ? sendEmail("refund-approved-student", studentEmail, {
        studentName, courseTitle: rr.course_title, amount: refundAmount, adminNotes: admin_notes || "",
      }, "student") : Promise.resolve(),
      trainerEmail ? sendEmail("refund-approved-trainer", trainerEmail, {
        trainerName, studentName, courseTitle: rr.course_title, amount: refundAmount, adminNotes: admin_notes || "",
      }, "trainer") : Promise.resolve(),
    ]);

    await svc.from("admin_activity_log").insert({
      event_type: "refund_approved",
      title: "Refund Approved",
      description: `Approved ₹${refundAmount} refund for ${studentName} — "${rr.course_title}"`,
      metadata: { request_id, enrollment_id: rr.enrollment_id, amount: refundAmount, processed_by: adminUserId, admin_notes },
    });

    return new Response(JSON.stringify({ success: true, status: "approved", refunded: refundAmount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Admin process refund error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
