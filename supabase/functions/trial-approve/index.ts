import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { formatIST } from "../_shared/dateUtils.ts";
import { isHourInBands, toLocalDateString } from "../_shared/slotBands.ts";

async function sendEmail(supabaseUrl: string, serviceKey: string, type: string, to: string, data: Record<string, any>) {
  try {
    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
      body: JSON.stringify({ type, to, data }),
    });
  } catch (err) {
    console.error(`Email error (${type}):`, err);
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.user.id;
    const { trial_booking_id, action, rejection_reason } = await req.json();

    if (!trial_booking_id || !["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceKey);

    // Get trial booking
    const { data: booking, error: bookingErr } = await serviceClient
      .from("trial_bookings")
      .select("*, courses(title, session_duration_mins, id, course_start_date, available_slot_bands), students(user_id), trainers:trainer_id(user_id)")
      .eq("id", trial_booking_id)
      .single();

    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: "Trial booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify trainer owns this booking
    if (booking.trainers?.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (booking.status !== "pending") {
      return new Response(JSON.stringify({ error: "Booking already processed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch names
    const [{ data: studentProfile }, { data: trainerProfile }] = await Promise.all([
      serviceClient.from("profiles").select("full_name, email").eq("id", booking.students?.user_id).single(),
      serviceClient.from("profiles").select("full_name, email").eq("id", userId).single(),
    ]);

    const studentName = studentProfile?.full_name || "Student";
    const trainerName = trainerProfile?.full_name || "Trainer";

    if (action === "approve") {
      // Use student-selected slot from the trial booking row.
      // Fall back to legacy band-name mapping for older rows that lack selected_date/hour.
      let slotDateStr: string | null = booking.selected_date ?? null;
      let slotHour: number | null = (typeof booking.selected_hour === "number") ? booking.selected_hour : null;

      if (!slotDateStr || slotHour === null) {
        // Legacy fallback
        const TIME_SLOTS: Record<string, number> = { "Early Morning": 6, Morning: 9, Afternoon: 12, Evening: 16, Night: 20 };
        const fallbackHour = TIME_SLOTS[booking.selected_slot] ?? 10;
        const now = new Date();
        const targetDay = booking.selected_day ?? ((now.getDay() + 2) % 7);
        let daysUntil = targetDay - now.getDay();
        if (daysUntil <= 1) daysUntil += 7;
        const fallback = new Date(now);
        fallback.setDate(now.getDate() + daysUntil);
        fallback.setHours(fallbackHour, 0, 0, 0);
        slotDateStr = toLocalDateString(fallback);
        slotHour = fallbackHour;
      }

      // Validate against course start date + bands
      const todayStr = toLocalDateString(new Date());
      if (slotDateStr < todayStr) {
        return new Response(JSON.stringify({ error: "Trial slot is in the past. Ask student to rebook." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (booking.courses?.course_start_date && slotDateStr < booking.courses.course_start_date) {
        return new Response(JSON.stringify({ error: `Trial date is before the course start date (${booking.courses.course_start_date}).` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const allowedBands: string[] = Array.isArray(booking.courses?.available_slot_bands) && booking.courses.available_slot_bands.length > 0
        ? booking.courses.available_slot_bands
        : ["morning", "day", "evening"];
      if (!isHourInBands(slotHour, allowedBands)) {
        return new Response(JSON.stringify({ error: "Selected time is outside the course's available slots." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check the slot isn't already taken
      const { data: clash } = await serviceClient
        .from("trainer_booked_slots")
        .select("id")
        .eq("trainer_id", booking.trainer_id)
        .eq("slot_date", slotDateStr)
        .eq("slot_hour", slotHour)
        .maybeSingle();
      if (clash) {
        return new Response(JSON.stringify({ error: "That slot is already booked. Ask the student to pick another time." }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const [yy, mm, dd] = slotDateStr.split("-").map(Number);
      const firstDate = new Date(yy, mm - 1, dd, slotHour, 0, 0, 0);

      // Generate real Jitsi meet link
      const slug = (booking.courses?.title || "trial").replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "-").toLowerCase().slice(0, 30);
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const meetLink = `https://meet.jit.si/skillmitra-${slug}-trial-${uniqueId}`;

      // Create enrollment
      const { data: enrollment, error: enrollErr } = await serviceClient.from("enrollments").insert({
        course_id: booking.course_id,
        student_id: booking.student_id,
        trainer_id: booking.trainer_id,
        status: "trial",
        amount_paid: 0,
        sessions_total: 1,
        start_date: slotDateStr,
      }).select().single();

      if (enrollErr) throw enrollErr;

      // Create session
      const { data: session, error: sessionErr } = await serviceClient.from("course_sessions").insert({
        enrollment_id: enrollment.id,
        trainer_id: booking.trainer_id,
        title: `Free Trial: ${booking.courses?.title || "Course"}`,
        session_number: 1,
        is_trial: true,
        scheduled_at: firstDate.toISOString(),
        duration_mins: booking.courses?.session_duration_mins || 60,
        status: "upcoming",
        meet_link: meetLink,
      }).select("id").single();

      if (sessionErr) throw sessionErr;

      // Reserve the slot (unique-constraint protects against race)
      const { error: slotErr } = await serviceClient.from("trainer_booked_slots").insert({
        trainer_id: booking.trainer_id,
        slot_date: slotDateStr,
        slot_hour: slotHour,
        session_id: session?.id,
        trial_booking_id,
        enrollment_id: enrollment.id,
      });
      if (slotErr) {
        console.error("Trial slot reservation failed:", slotErr);
      }

      // Update booking
      await serviceClient.from("trial_bookings").update({
        status: "approved",
        scheduled_at: firstDate.toISOString(),
        meet_link: meetLink,
        responded_at: new Date().toISOString(),
      }).eq("id", trial_booking_id);

      const scheduledTimeStr = formatIST(firstDate.toISOString());

      // Notifications
      await serviceClient.from("notifications").insert({
        user_id: booking.students?.user_id,
        title: "Trial Approved! ✅",
        body: `Your free trial for "${booking.courses?.title}" with ${trainerName} is confirmed. Session: ${scheduledTimeStr}.`,
        type: "trial_approved",
        action_url: "/student/sessions",
      });

      // Emails
      if (studentProfile?.email) {
        await sendEmail(supabaseUrl, serviceKey, "trial_approved_student", studentProfile.email, {
          name: studentName,
          course_name: booking.courses?.title,
          trainer_name: trainerName,
          scheduled_time: scheduledTimeStr,
          meet_link: meetLink,
        });
      }

      const { data: admins } = await serviceClient.from("admins").select("email").eq("is_active", true).limit(3);
      for (const admin of (admins || [])) {
        if (admin.email) {
          await sendEmail(supabaseUrl, serviceKey, "trial_approved_admin", admin.email, {
            student_name: studentName,
            trainer_name: trainerName,
            course_name: booking.courses?.title,
            scheduled_time: scheduledTimeStr,
          });
        }
      }

      // Activity log
      await serviceClient.from("admin_activity_log").insert({
        event_type: "trial_approved",
        title: "Trial Approved",
        description: `${trainerName} approved trial for ${studentName} — "${booking.courses?.title}"`,
        metadata: { trial_booking_id, student_id: booking.student_id, trainer_id: booking.trainer_id },
      });

      return new Response(JSON.stringify({ success: true, enrollment_id: enrollment.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      // Reject
      await serviceClient.from("trial_bookings").update({
        status: "rejected",
        rejection_reason: rejection_reason || null,
        responded_at: new Date().toISOString(),
      }).eq("id", trial_booking_id);

      await serviceClient.from("notifications").insert({
        user_id: booking.students?.user_id,
        title: "Trial Request Declined",
        body: `Your trial request for "${booking.courses?.title}" was declined.${rejection_reason ? ` Reason: ${rejection_reason}` : ''} You can book with another trainer.`,
        type: "trial_rejected",
        action_url: "/browse-trainers",
      });

      if (studentProfile?.email) {
        await sendEmail(supabaseUrl, serviceKey, "trial_rejected_student", studentProfile.email, {
          name: studentName,
          course_name: booking.courses?.title,
          trainer_name: trainerName,
          reason: rejection_reason || '',
        });
      }

      const { data: admins } = await serviceClient.from("admins").select("email").eq("is_active", true).limit(3);
      for (const admin of (admins || [])) {
        if (admin.email) {
          await sendEmail(supabaseUrl, serviceKey, "trial_rejected_admin", admin.email, {
            student_name: studentName,
            trainer_name: trainerName,
            course_name: booking.courses?.title,
            reason: rejection_reason || '',
          });
        }
      }

      await serviceClient.from("admin_activity_log").insert({
        event_type: "trial_rejected",
        title: "Trial Rejected",
        description: `${trainerName} rejected trial for ${studentName} — "${booking.courses?.title}"`,
        metadata: { trial_booking_id, reason: rejection_reason },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("Trial approve error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
