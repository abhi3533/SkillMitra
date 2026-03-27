import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { getCorsHeaders } from "../_shared/cors.ts"

const GENERATE_SYSTEM = `You are an expert technical interviewer. Generate interview questions for the given role and difficulty.

IMPORTANT: Respond ONLY with valid JSON, no markdown, no code fences.

Return a JSON array of question objects with this exact format:
[
  { "id": 1, "question": "Your question here", "topic": "Topic name" }
]

Generate exactly the number of questions requested. Questions should be relevant, practical, and test real knowledge.`;

const EVALUATE_SYSTEM = `You are an expert technical interviewer evaluating a candidate's answer.

IMPORTANT: Respond ONLY with valid JSON, no markdown, no code fences.

Evaluate the answer and return JSON with this exact format:
{
  "technicalScore": <number 0-100>,
  "communicationScore": <number 0-100>,
  "confidenceScore": <number 0-100>,
  "feedback": "<2-3 sentence constructive feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}

Be fair but constructive. If the answer is empty or says "skip", give low scores and encourage the student to attempt an answer.`;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, role, difficulty, questionCount, question, answer } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let messages: { role: string; content: string }[];
    let systemPrompt: string;

    if (action === "generate") {
      systemPrompt = GENERATE_SYSTEM;
      messages = [
        { role: "user", content: `Generate ${questionCount || 5} ${difficulty || "intermediate"} level interview questions for a ${role || "Frontend Developer"} position.` },
      ];
    } else if (action === "evaluate") {
      systemPrompt = EVALUATE_SYSTEM;
      messages = [
        { role: "user", content: `Question: ${question}\n\nCandidate's Answer: ${answer}\n\nEvaluate this answer.` },
      ];
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the AI response
    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-interview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
