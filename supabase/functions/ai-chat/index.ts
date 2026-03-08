import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are SkillMitra's friendly assistant. Help visitors find the right trainer, understand how the platform works, answer questions about pricing, courses, and the signup process.

Key facts about SkillMitra:
- SkillMitra connects students with verified expert trainers for 1:1 personalized skill training
- Students can book free trial sessions before enrolling
- Trainers are industry professionals verified by the SkillMitra team
- Courses cover skills like Python, React, Data Science, UI/UX Design, Digital Marketing, and more
- Training is conducted online via video calls
- Students get certificates upon course completion
- Trainers can sign up at /trainer/signup, students at /student/signup
- Contact email: contact@skillmitra.online

If you cannot answer a question, say: "I'd love to help! Let me connect you with our team at contact@skillmitra.online for more details."

Keep responses short, friendly, and under 100 words. Use emojis sparingly for warmth.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, sessionId, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("API key not configured");

    // Save/update session
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (sessionId) {
      await supabase.from("ai_chat_sessions").update({
        messages,
        updated_at: new Date().toISOString(),
      }).eq("id", sessionId);
    } else {
      const { data: session } = await supabase.from("ai_chat_sessions").insert({
        user_id: userId || null,
        messages,
      }).select("id").single();
      // We'll return the session ID in non-streaming mode or via header
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
