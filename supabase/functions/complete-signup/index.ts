import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated and matches the user_id in the body
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, role, trainer_data, student_data } = await req.json();

    if (!user_id || !role) {
      return new Response(JSON.stringify({ error: "user_id and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the token belongs to the claimed user_id (prevents IDOR)
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: callerUser }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !callerUser || callerUser.id !== user_id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (role === "trainer") {
      // Always ensure the trainer has a referral_code (mirrors the student path).
      // The DB trigger generates one at INSERT time, but it can be missing if the
      // trigger didn't fire or produced a collision. Re-generate here if absent.
      const { data: trainerRow } = await supabaseAdmin
        .from("trainers")
        .select("id, referral_code")
        .eq("user_id", user_id)
        .maybeSingle();

      if (trainerRow && !trainerRow.referral_code) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let referralCode: string | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          let candidate = "TM-";
          for (let i = 0; i < 6; i++) candidate += chars[Math.floor(Math.random() * chars.length)];
          const { data: existing } = await supabaseAdmin
            .from("trainers")
            .select("id")
            .eq("referral_code", candidate)
            .maybeSingle();
          if (!existing) {
            referralCode = candidate;
            break;
          }
        }
        if (referralCode) {
          const { error: codeErr } = await supabaseAdmin
            .from("trainers")
            .update({ referral_code: referralCode })
            .eq("id", trainerRow.id);
          if (codeErr) console.error("Trainer referral code update failed:", codeErr);
        }
      }

      if (!trainer_data) {
        // Called only for referral code generation — no profile update needed.
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: trainer, error: trainerErr } = await supabaseAdmin
        .from("trainers")
        .select("id")
        .eq("user_id", user_id)
        .single();

      if (trainerErr || !trainer) {
        console.error("Trainer lookup failed:", trainerErr);
        return new Response(JSON.stringify({ error: "Trainer profile not found", details: trainerErr?.message }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await supabaseAdmin.from("trainers").update({
        bio: trainer_data.bio || null,
        skills: trainer_data.skills || [],
        teaching_languages: trainer_data.teaching_languages || [],
        experience_years: trainer_data.experience_years || 0,
        current_role: trainer_data.current_role || null,
        current_company: trainer_data.current_company || null,
        linkedin_url: trainer_data.linkedin_url || null,
        previous_companies: trainer_data.previous_companies || [],
        bank_account_number: trainer_data.bank_account_number || null,
        ifsc_code: trainer_data.ifsc_code || null,
        upi_id: trainer_data.upi_id || null,
        pan_number: trainer_data.pan_number || null,
        account_holder_name: trainer_data.account_holder_name || null,
        intro_video_url: trainer_data.intro_video_url || null,
        // New fields
        dob: trainer_data.dob || null,
        whatsapp: trainer_data.whatsapp || null,
        selfie_url: trainer_data.selfie_url || null,
        address: trainer_data.address || null,
        pincode: trainer_data.pincode || null,
        portfolio_url: trainer_data.portfolio_url || null,
        secondary_skill: trainer_data.secondary_skill || null,
        work_email: trainer_data.work_email || null,
        expertise_areas: trainer_data.expertise_areas || [],
        demo_video_url: trainer_data.demo_video_url || null,
        curriculum_pdf_url: trainer_data.curriculum_pdf_url || null,
        services_offered: trainer_data.services_offered || [],
        course_materials: trainer_data.course_materials || null,
        govt_id_type: trainer_data.govt_id_type || null,
        aadhaar_url: trainer_data.aadhaar_url || null,
        additional_services_details: trainer_data.additional_services_details || null,
        course_title: trainer_data.course_title || null,
        course_duration: trainer_data.course_duration || null,
        course_fee: trainer_data.course_fee || 0,
        course_description: trainer_data.course_description || null,
        verification_method: trainer_data.verification_method || null,
        verification_value: trainer_data.verification_value || null,
        trainer_type: trainer_data.trainer_type || null,
        session_duration_per_day: trainer_data.session_duration_per_day || null,
        available_time_bands: trainer_data.available_time_bands || [],
        weekend_availability: trainer_data.weekend_availability || null,
      }).eq("id", trainer.id);

      if (updateErr) {
        console.error("Trainer update failed:", updateErr);
        return new Response(JSON.stringify({ error: "Failed to update trainer", details: updateErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update onboarding_status to "pending" so trainer appears in admin Pending tab
      const { error: statusErr } = await supabaseAdmin.from("trainers").update({
        onboarding_status: "pending",
        onboarding_step: 7,
        last_saved_at: new Date().toISOString(),
      }).eq("id", trainer.id);
      if (statusErr) console.error("Onboarding status update failed:", statusErr);

      // Insert availability if provided
      if (trainer_data.availability && trainer_data.availability.length > 0) {
        const availRows = trainer_data.availability.map((a: any) => ({
          trainer_id: trainer.id,
          day_of_week: a.day_of_week,
          start_time: a.start_time,
          end_time: a.end_time,
          is_available: a.is_available,
        }));
        const { error: availErr } = await supabaseAdmin.from("trainer_availability").insert(availRows);
        if (availErr) console.error("Availability insert failed:", availErr);
      }

      // Insert documents if provided
      if (trainer_data.documents && trainer_data.documents.length > 0) {
        for (const doc of trainer_data.documents) {
          const { error: docErr } = await supabaseAdmin.from("trainer_documents").insert({
            trainer_id: trainer.id,
            document_type: doc.document_type,
            document_name: doc.document_name,
            document_url: doc.document_url,
          });
          if (docErr) console.error("Document insert failed:", docErr);
        }
      }

      // Update profile picture if provided
      if (trainer_data.profile_picture_url) {
        await supabaseAdmin.from("profiles").update({
          profile_picture_url: trainer_data.profile_picture_url,
        }).eq("id", user_id);
      }

      return new Response(JSON.stringify({ success: true, trainer_id: trainer.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (role === "student") {
      // Always ensure the student has a referral_code; also save any course interests.
      const { data: studentRow } = await supabaseAdmin
        .from("students")
        .select("referral_code")
        .eq("user_id", user_id)
        .single();

      const updates: Record<string, unknown> = {};

      if (!studentRow?.referral_code) {
        // Generate a unique referral code, retrying on the rare collision.
        let referralCode: string | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          const candidate =
            "SM-" +
            Math.random().toString(36).toUpperCase().slice(2, 8);
          const { data: existing } = await supabaseAdmin
            .from("students")
            .select("id")
            .eq("referral_code", candidate)
            .maybeSingle();
          if (!existing) {
            referralCode = candidate;
            break;
          }
        }
        if (referralCode) updates.referral_code = referralCode;
      }

      if (student_data?.course_interests && student_data.course_interests.length > 0) {
        updates.course_interests = student_data.course_interests;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabaseAdmin
          .from("students")
          .update(updates)
          .eq("user_id", user_id);
        if (updateErr) console.error("Student update failed:", updateErr);
      }

      // Send welcome email to student
      try {
        const { data: profile } = await supabaseAdmin.from("profiles").select("full_name, email").eq("id", user_id).single();
        if (profile?.email) {
          await supabaseAdmin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "welcome-student",
              recipientEmail: profile.email,
              idempotencyKey: `welcome-student-${user_id}`,
              templateData: { name: profile.full_name || "" },
            },
          });
        }
      } catch (emailErr) {
        console.error("Welcome email failed (non-blocking):", emailErr);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("complete-signup error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
