import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_EMAIL = "SkillMitra <contact@skillmitra.online>";

function buildInvitationHtml(isReminder: boolean) {
  const reminderNote = isReminder
    ? `<tr><td style="padding:0 25px 20px"><p style="margin:0;padding:10px 15px;background:#FFF7ED;border-left:4px solid #F59E0B;border-radius:4px;font-size:14px;color:#92400E">⏰ Friendly reminder — your invitation is still open! Join 100+ trainers already teaching on SkillMitra.</p></td></tr>`
    : "";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05)">

<!-- Logo Header -->
<tr><td style="background:#0F172A;padding:24px 25px;text-align:center">
<table cellpadding="0" cellspacing="0" style="display:inline-block"><tr>
<td style="background:#1A56DB;width:36px;height:36px;border-radius:8px;text-align:center;vertical-align:middle">
<span style="color:#ffffff;font-weight:800;font-size:18px;line-height:36px">S</span>
</td>
<td style="padding-left:10px">
<span style="color:#ffffff;font-weight:700;font-size:20px;letter-spacing:-0.5px">Skill</span><span style="color:#3B82F6;font-weight:700;font-size:20px;letter-spacing:-0.5px">Mitra</span>
</td></tr></table>
<p style="margin:6px 0 0;color:#94A3B8;font-size:11px;letter-spacing:1px">FIND YOUR TRAINER IN 30 MINUTES</p>
</td></tr>

${reminderNote}

<!-- Main Content -->
<tr><td style="padding:30px 25px 0">
<h1 style="margin:0 0 15px;font-size:24px;font-weight:700;color:#0F172A">You're Invited to Teach on SkillMitra! 🎓</h1>
<p style="margin:0 0 20px;font-size:15px;color:#64748B;line-height:1.6">
SkillMitra is India's fastest-growing 1-on-1 online teaching platform. We connect skilled professionals and trainers with students across India who want to learn directly from industry experts.
</p>
<p style="margin:0 0 25px;font-size:15px;color:#64748B;line-height:1.6">
We think you'd be a great addition to our trainer community. Here's what you get:
</p>
</td></tr>

<!-- Benefits -->
<tr><td style="padding:0 25px">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F7FF;border-radius:10px;padding:20px">
<tr><td style="padding:20px">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:6px 0;font-size:15px;color:#0F172A">💰 <strong>Earn ₹10,000 – ₹1,20,000/month</strong></td></tr>
<tr><td style="padding:6px 0;font-size:15px;color:#0F172A">📅 <strong>Set your own price & schedule</strong></td></tr>
<tr><td style="padding:6px 0;font-size:15px;color:#0F172A">🎓 <strong>Students from across India</strong></td></tr>
<tr><td style="padding:6px 0;font-size:15px;color:#0F172A">💳 <strong>Get paid securely via Razorpay</strong></td></tr>
<tr><td style="padding:6px 0;font-size:15px;color:#0F172A">✅ <strong>Free profile & verified badge</strong></td></tr>
</table>
</td></tr></table>
</td></tr>

<!-- Steps -->
<tr><td style="padding:25px 25px 0">
<h2 style="margin:0 0 15px;font-size:18px;font-weight:600;color:#0F172A">Getting Started is Easy:</h2>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0">
<table cellpadding="0" cellspacing="0"><tr>
<td style="background:#1A56DB;color:#fff;width:28px;height:28px;border-radius:50%;text-align:center;font-size:13px;font-weight:700;line-height:28px">1</td>
<td style="padding-left:12px;font-size:14px;color:#334155"><strong>Sign up</strong> at skillmitra.online/trainer/signup</td>
</tr></table></td></tr>
<tr><td style="padding:8px 0">
<table cellpadding="0" cellspacing="0"><tr>
<td style="background:#1A56DB;color:#fff;width:28px;height:28px;border-radius:50%;text-align:center;font-size:13px;font-weight:700;line-height:28px">2</td>
<td style="padding-left:12px;font-size:14px;color:#334155"><strong>Complete your profile</strong> — add skills, experience & courses</td>
</tr></table></td></tr>
<tr><td style="padding:8px 0">
<table cellpadding="0" cellspacing="0"><tr>
<td style="background:#1A56DB;color:#fff;width:28px;height:28px;border-radius:50%;text-align:center;font-size:13px;font-weight:700;line-height:28px">3</td>
<td style="padding-left:12px;font-size:14px;color:#334155"><strong>Get verified</strong> by our admin team</td>
</tr></table></td></tr>
<tr><td style="padding:8px 0">
<table cellpadding="0" cellspacing="0"><tr>
<td style="background:#1A56DB;color:#fff;width:28px;height:28px;border-radius:50%;text-align:center;font-size:13px;font-weight:700;line-height:28px">4</td>
<td style="padding-left:12px;font-size:14px;color:#334155"><strong>Start teaching</strong> and earning!</td>
</tr></table></td></tr>
</table>
</td></tr>

<!-- CTA Button -->
<tr><td style="padding:30px 25px;text-align:center">
<a href="https://skillmitra.online/trainer/signup" style="display:inline-block;background:#1A56DB;color:#ffffff;font-size:16px;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none">Join SkillMitra Now →</a>
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 25px;border-top:1px solid #E2E8F0;text-align:center">
<p style="margin:0;font-size:12px;color:#94A3B8">© 2025 SkillMitra. All rights reserved.</p>
<p style="margin:8px 0 0;font-size:12px;color:#94A3B8">Questions? Reply to this email or visit <a href="https://skillmitra.online" style="color:#1A56DB;text-decoration:none">skillmitra.online</a></p>
</td></tr>

</table>
</td></tr></table>
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
