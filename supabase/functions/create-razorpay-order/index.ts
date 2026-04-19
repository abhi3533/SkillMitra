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
    const userId = claimsData.user.id;

    const {
      course_id,
      student_id,
      amount,
      wallet_deduction = 0,
      referral_discount = 0,
    } = await req.json();

    if (!course_id || !student_id || amount === undefined || amount === null || amount < 0) {
      return new Response(JSON.stringify({ error: "Invalid parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify student belongs to authenticated user
    const { data: student } = await supabase
      .from("students")
      .select("id, user_id, referred_by")
      .eq("id", student_id)
      .single();

    if (!student || student.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify course exists and recompute final amount server-side
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: course } = await serviceClient
      .from("courses")
      .select("id, title, course_fee")
      .eq("id", course_id)
      .single();

    if (!course) {
      return new Response(JSON.stringify({ error: "Course not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const courseFee = Number(course.course_fee);

    // Validate referral discount: only ₹100 if student is referred AND has no prior active enrollment
    let serverReferralDiscount = 0;
    if (Number(referral_discount) > 0 && student.referred_by) {
      const { count: prevEnroll } = await serviceClient
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("student_id", student_id)
        .eq("status", "active");
      if ((prevEnroll || 0) === 0) serverReferralDiscount = 100;
    }

    // Validate wallet deduction: cap at user's actual balance and at remaining fee
    let serverWalletDeduction = 0;
    const requestedWallet = Math.max(0, Number(wallet_deduction) || 0);
    if (requestedWallet > 0) {
      const { data: wallet } = await serviceClient
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      const balance = Number(wallet?.balance || 0);
      const remainingAfterReferral = Math.max(0, courseFee - serverReferralDiscount);
      serverWalletDeduction = Math.min(requestedWallet, balance, remainingAfterReferral);
    }

    const finalAmount = Math.max(0, courseFee - serverReferralDiscount - serverWalletDeduction);

    // Sanity check client-submitted amount matches our computation (within 1 rupee)
    if (Math.abs(Number(amount) - finalAmount) > 1) {
      return new Response(JSON.stringify({ error: "Amount mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Free enrollment path: fully covered by wallet + referral ----
    if (finalAmount <= 0) {
      // Insert a $0 payment record so verify-payment can pick it up
      const { data: payment } = await serviceClient.from("payments").insert({
        student_id,
        amount: 0,
        razorpay_order_id: `free_${Date.now()}_${course_id.slice(0, 8)}`,
        status: "captured",
        payment_method: "wallet",
      }).select("id, razorpay_order_id").single();

      return new Response(
        JSON.stringify({
          free_enrollment: true,
          order_id: payment?.razorpay_order_id,
          amount: 0,
          currency: "INR",
          wallet_deduction: serverWalletDeduction,
          referral_discount: serverReferralDiscount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Razorpay path ----
    const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    // Diagnostic: log key mode (test vs live) — safe, only logs prefix
    const keyMode = keyId?.startsWith("rzp_test_") ? "TEST" : keyId?.startsWith("rzp_live_") ? "LIVE" : "UNKNOWN";
    console.log(`[razorpay] key_mode=${keyMode}, key_prefix=${keyId?.substring(0, 12)}, amount=${finalAmount}`);

    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: Math.trunc(finalAmount) * 100, // paise — integer-safe
        currency: "INR",
        receipt: `sm_${course_id.slice(0, 8)}_${Date.now()}`,
        notes: {
          course_id,
          student_id,
          course_title: course.title,
          wallet_deduction: String(serverWalletDeduction),
          referral_discount: String(serverReferralDiscount),
        },
      }),
    });

    const razorpayOrder = await razorpayRes.json();

    if (!razorpayRes.ok) {
      console.error("Razorpay error:", razorpayOrder);
      return new Response(
        JSON.stringify({ error: "Failed to create payment order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create payment record in DB — store discounts in metadata via amount fields
    await serviceClient.from("payments").insert({
      student_id,
      amount: finalAmount,
      razorpay_order_id: razorpayOrder.id,
      status: "created",
      payment_method: "razorpay",
    });

    // Get student profile for prefill
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", userId)
      .single();

    return new Response(
      JSON.stringify({
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: keyId,
        wallet_deduction: serverWalletDeduction,
        referral_discount: serverReferralDiscount,
        prefill: {
          name: profile?.full_name || "",
          email: profile?.email || "",
          contact: profile?.phone || "",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Order creation error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
