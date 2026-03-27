import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(supabaseUrl, serviceKey);

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: expired } = await client
      .from("trial_bookings")
      .select("id, student_id, trainer_id, course_id, students(user_id), trainers:trainer_id(user_id), courses(title)")
      .eq("status", "pending")
      .lt("created_at", cutoff);

    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    for (const booking of expired) {
      await client.from("trial_bookings").update({
        status: "auto_rejected",
        responded_at: new Date().toISOString(),
      }).eq("id", booking.id);

      // Get profiles
      const [{ data: studentProfile }, { data: trainerProfile }] = await Promise.all([
        client.from("profiles").select("full_name, email").eq("id", booking.students?.user_id).single(),
        client.from("profiles").select("full_name, email").eq("id", booking.trainers?.user_id).single(),
      ]);

      // Notify student
      await client.from("notifications").insert({
        user_id: booking.students?.user_id,
        title: "Trial Auto-Declined",
        body: `Your trial request for "${booking.courses?.title}" was auto-declined as the trainer didn't respond within 24 hours. Try another trainer!`,
        type: "trial_rejected",
        action_url: "/browse-trainers",
      });

      if (studentProfile?.email) {
        await sendEmail(supabaseUrl, serviceKey, "trial_rejected_student", studentProfile.email, {
          name: studentProfile.full_name || "Student",
          course_name: booking.courses?.title,
          trainer_name: trainerProfile?.full_name || "Trainer",
          auto_rejected: true,
        });
      }

      // Admin emails
      const { data: admins } = await client.from("admins").select("email").eq("is_active", true).limit(3);
      for (const admin of (admins || [])) {
        if (admin.email) {
          await sendEmail(supabaseUrl, serviceKey, "trial_rejected_admin", admin.email, {
            student_name: studentProfile?.full_name || "Student",
            trainer_name: trainerProfile?.full_name || "Trainer",
            course_name: booking.courses?.title,
            auto_rejected: true,
          });
        }
      }

      await client.from("admin_activity_log").insert({
        event_type: "trial_auto_rejected",
        title: "Trial Auto-Rejected (24h)",
        description: `Trial for "${booking.courses?.title}" auto-rejected — trainer ${trainerProfile?.full_name || 'Unknown'} did not respond`,
        metadata: { trial_booking_id: booking.id },
      });
    }

    console.log(`Auto-rejected ${expired.length} trial(s)`);
    return new Response(JSON.stringify({ processed: expired.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Auto-reject error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
