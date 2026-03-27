import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_EMAIL = "SkillMitra <contact@skillmitra.online>";

function buildInvitationHtml(isReminder: boolean) {
  const BRAND_COLOR = '#1A56DB';
  const reminderNote = isReminder
    ? `<p style="margin:0 0 20px;padding:10px 15px;background:#FFF7ED;border-left:4px solid #F59E0B;border-radius:4px;font-size:14px;color:#92400E">⏰ Friendly reminder — your invitation is still open! Join 100+ trainers already teaching on SkillMitra.</p>`
    : "";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;">

<!-- Logo Header -->
<div style="text-align:center;margin-bottom:28px;">
<h2 style="margin:0;font-size:22px;color:#111;">Skill<span style="color:${BRAND_COLOR};">Mitra</span></h2>
</div>

${reminderNote}

<!-- Main Content -->
<h1 style="font-size:20px;color:#111;margin-bottom:16px;">🎓 You're Invited to Teach on SkillMitra!</h1>
<p style="font-size:15px;line-height:1.7;color:#444;">
SkillMitra is India's fastest-growing 1-on-1 online teaching platform. We connect skilled professionals and trainers with students across India who want to learn directly from industry experts.
</p>
<p style="font-size:15px;line-height:1.7;color:#444;">
We think you'd be a great addition to our trainer community. Here's what you get:
</p>

<!-- Benefits -->
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
<table style="width:100%;font-size:14px;color:#444;">
<tr><td style="padding:6px 0;">💰 <strong>Earn ₹10,000 – ₹1,20,000/month</strong></td></tr>
<tr><td style="padding:6px 0;">📅 <strong>Set your own price & schedule</strong></td></tr>
<tr><td style="padding:6px 0;">🎓 <strong>Students from across India</strong></td></tr>
<tr><td style="padding:6px 0;">💳 <strong>Get paid securely via Razorpay</strong></td></tr>
<tr><td style="padding:6px 0;">✅ <strong>Free profile & verified badge</strong></td></tr>
</table>
</div>

<!-- Steps -->
<h2 style="font-size:16px;font-weight:600;color:#111;margin:24px 0 12px;">Getting Started is Easy:</h2>
<table style="width:100%;font-size:14px;color:#444;">
<tr><td style="padding:6px 0;"><strong>Step 1:</strong> Sign up at skillmitra.online/trainer/signup</td></tr>
<tr><td style="padding:6px 0;"><strong>Step 2:</strong> Complete your profile — add skills, experience & courses</td></tr>
<tr><td style="padding:6px 0;"><strong>Step 3:</strong> Get verified by our admin team</td></tr>
<tr><td style="padding:6px 0;"><strong>Step 4:</strong> Start teaching and earning!</td></tr>
</table>

<!-- CTA Button -->
<div style="text-align:center;margin:28px 0;">
<a href="https://skillmitra.online/trainer/signup" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Join SkillMitra Now →</a>
</div>

<p style="font-size:13px;color:#666;">Questions? Reply to this email or visit <a href="https://skillmitra.online" style="color:${BRAND_COLOR};text-decoration:none;">skillmitra.online</a></p>

<!-- Footer -->
<div style="margin-top:36px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;">
<p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Learnvate Solutions Private Limited. All rights reserved.</p>
</div>
</div>
</body></html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, emails, invitationId } = await req.json();

    if (action === "send_invitations") {
      // emails is an array of email strings
      if (!emails?.length) throw new Error("No emails provided");

      // Check which emails are already registered as trainers
      const { data: existingProfiles } = await supabase
        .from("profiles")
        .select("email")
        .in("email", emails);
      const registeredEmails = new Set((existingProfiles || []).map((p: any) => p.email?.toLowerCase()));

      // Check which emails are already invited
      const { data: existingInvites } = await supabase
        .from("trainer_invitations")
        .select("email")
        .in("email", emails);
      const alreadyInvited = new Set((existingInvites || []).map((i: any) => i.email?.toLowerCase()));

      const results = { sent: 0, skipped_registered: 0, skipped_duplicate: 0, failed: 0, errors: [] as string[] };

      // Get auth user from request
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) throw new Error("Unauthorized");

      for (const email of emails) {
        const normalizedEmail = email.toLowerCase().trim();
        if (!normalizedEmail || !normalizedEmail.includes("@")) continue;

        if (registeredEmails.has(normalizedEmail)) {
          results.skipped_registered++;
          continue;
        }
        if (alreadyInvited.has(normalizedEmail)) {
          results.skipped_duplicate++;
          continue;
        }

        try {
          await sendEmail(normalizedEmail, "You're invited to teach on SkillMitra 🎓", buildInvitationHtml(false));
          await supabase.from("trainer_invitations").insert({
            email: normalizedEmail,
            status: "invited",
            invited_by: user.id,
            emails_sent: 1,
          });
          results.sent++;
          alreadyInvited.add(normalizedEmail); // prevent duplicates within batch
        } catch (e: any) {
          results.failed++;
          results.errors.push(`${normalizedEmail}: ${e.message}`);
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "resend_invitation") {
      if (!invitationId) throw new Error("No invitation ID provided");

      const { data: inv } = await supabase
        .from("trainer_invitations")
        .select("*")
        .eq("id", invitationId)
        .single();
      if (!inv) throw new Error("Invitation not found");
      if (inv.emails_sent >= 2) throw new Error("Maximum emails already sent");
      if (inv.status === "signed_up") throw new Error("Trainer already signed up");

      await sendEmail(inv.email, "Reminder: You're invited to teach on SkillMitra 🎓", buildInvitationHtml(true));
      await supabase.from("trainer_invitations").update({
        emails_sent: inv.emails_sent + 1,
        reminder_sent_at: new Date().toISOString(),
        status: inv.status === "invited" ? "reminder_sent" : inv.status,
      }).eq("id", invitationId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "send_auto_reminders") {
      // Send reminders to invitations older than 3 days that haven't received a reminder
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const { data: pendingInvites } = await supabase
        .from("trainer_invitations")
        .select("*")
        .eq("status", "invited")
        .lt("invited_at", threeDaysAgo)
        .is("reminder_sent_at", null)
        .lt("emails_sent", 2);

      let sent = 0;
      for (const inv of (pendingInvites || [])) {
        try {
          // Double-check they haven't signed up
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("email", inv.email)
            .maybeSingle();
          if (profile) {
            await supabase.from("trainer_invitations").update({
              status: "signed_up",
              signed_up_at: new Date().toISOString(),
            }).eq("id", inv.id);
            continue;
          }

          await sendEmail(inv.email, "Reminder: You're invited to teach on SkillMitra 🎓", buildInvitationHtml(true));
          await supabase.from("trainer_invitations").update({
            emails_sent: inv.emails_sent + 1,
            reminder_sent_at: new Date().toISOString(),
            status: "reminder_sent",
          }).eq("id", inv.id);
          sent++;
        } catch (e) {
          console.error(`Failed reminder for ${inv.email}:`, e);
        }
      }

      return new Response(JSON.stringify({ success: true, reminders_sent: sent }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "sync_signups") {
      // Check if any invited trainers have since signed up
      const { data: invites } = await supabase
        .from("trainer_invitations")
        .select("*")
        .in("status", ["invited", "reminder_sent"]);

      let updated = 0;
      for (const inv of (invites || [])) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("email", inv.email)
          .maybeSingle();
        if (profile) {
          await supabase.from("trainer_invitations").update({
            status: "signed_up",
            signed_up_at: new Date().toISOString(),
          }).eq("id", inv.id);
          updated++;
        }
      }

      return new Response(JSON.stringify({ success: true, updated }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
