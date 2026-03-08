import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const results: any[] = [];

  // 1. Create Student account
  try {
    const { data: studentAuth, error: studentErr } = await supabaseAdmin.auth.admin.createUser({
      email: "student@skillmitra.com",
      password: "Test@1234",
      email_confirm: true,
      user_metadata: {
        full_name: "Rahul Verma",
        role: "student",
        phone: "9876543210",
        city: "Hyderabad",
        state: "Telangana",
        gender: "Male",
        language_preference: ["Telugu", "English"],
        trainer_gender_preference: "no_preference",
      },
    });
    if (studentErr) {
      results.push({ account: "student", status: "error", error: studentErr.message });
    } else {
      results.push({ account: "student", status: "created", userId: studentAuth.user?.id });
    }
  } catch (e) {
    results.push({ account: "student", status: "error", error: String(e) });
  }

  // 2. Create Trainer account
  try {
    const { data: trainerAuth, error: trainerErr } = await supabaseAdmin.auth.admin.createUser({
      email: "trainer@skillmitra.com",
      password: "Test@1234",
      email_confirm: true,
      user_metadata: {
        full_name: "Priya Sharma",
        role: "trainer",
        phone: "9876543211",
        city: "Bangalore",
        state: "Karnataka",
        gender: "Female",
        language_preference: ["English", "Hindi"],
      },
    });
    if (trainerErr) {
      results.push({ account: "trainer", status: "error", error: trainerErr.message });
    } else {
      const trainerId = trainerAuth.user?.id;
      // Update trainer record with skills, experience, approval
      const { data: trainerRow } = await supabaseAdmin
        .from("trainers")
        .select("id")
        .eq("user_id", trainerId!)
        .single();

      if (trainerRow) {
        await supabaseAdmin
          .from("trainers")
          .update({
            skills: ["Python", "Data Science"],
            experience_years: 5,
            approval_status: "approved",
            bio: "Experienced Python and Data Science trainer with 5+ years of industry experience.",
            current_company: "TechCorp",
            current_role: "Senior Data Scientist",
            teaching_languages: ["English", "Hindi"],
          })
          .eq("id", trainerRow.id);
      }

      // Mark profile as verified
      await supabaseAdmin
        .from("profiles")
        .update({ is_verified: true })
        .eq("id", trainerId!);

      results.push({ account: "trainer", status: "created", userId: trainerId });
    }
  } catch (e) {
    results.push({ account: "trainer", status: "error", error: String(e) });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
