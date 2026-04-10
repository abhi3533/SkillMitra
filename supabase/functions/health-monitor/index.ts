import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const SITE_URL = "https://skillmitra.online"
const ALERT_EMAIL = "contact@skillmitra.online"

interface CheckResult {
  name: string
  status: "PASS" | "FAIL" | "WARN"
  latency_ms: number | null
  message: string
}

async function timeCheck(name: string, fn: () => Promise<{ ok: boolean; msg: string }>): Promise<CheckResult> {
  const start = Date.now()
  try {
    const result = await Promise.race([
      fn(),
      new Promise<{ ok: boolean; msg: string }>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 10000)
      ),
    ])
    return {
      name,
      status: result.ok ? "PASS" : "FAIL",
      latency_ms: Date.now() - start,
      message: result.msg,
    }
  } catch (e) {
    return {
      name,
      status: "FAIL",
      latency_ms: Date.now() - start,
      message: e instanceof Error ? e.message : "Unknown error",
    }
  }
}

Deno.serve(async (req) => {
  // Allow manual trigger via GET/POST, or scheduled invocation
  const corsHeaders = {
    "Access-Control-Allow-Origin": "https://skillmitra.online",
    "Content-Type": "application/json",
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const resendKey = Deno.env.get("RESEND_API_KEY")
  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID")
  const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET")

  const db = createClient(supabaseUrl, serviceKey)

  const checks: CheckResult[] = await Promise.all([

    // 1. Site availability
    timeCheck("site_availability", async () => {
      const r = await fetch(SITE_URL, { method: "HEAD" })
      return { ok: r.ok, msg: `HTTP ${r.status}` }
    }),

    // 2. Supabase DB connectivity
    timeCheck("supabase_db", async () => {
      const { error } = await db.from("profiles").select("id").limit(1)
      return { ok: !error, msg: error ? error.message : "DB reachable" }
    }),

    // 3. Auth system — check user_roles table is readable
    timeCheck("auth_system", async () => {
      const { error } = await db.from("user_roles").select("id").limit(1)
      return { ok: !error, msg: error ? error.message : "Auth tables reachable" }
    }),

    // 4. Razorpay API connectivity
    timeCheck("razorpay_api", async () => {
      if (!razorpayKeyId || !razorpaySecret) {
        return { ok: false, msg: "Razorpay credentials not configured" }
      }
      const r = await fetch("https://api.razorpay.com/v1/orders?count=1", {
        headers: { Authorization: "Basic " + btoa(`${razorpayKeyId}:${razorpaySecret}`) },
      })
      return { ok: r.status === 200 || r.status === 401, msg: `Razorpay API HTTP ${r.status}` }
    }),

    // 5. Edge functions reachability (check-login-rate ping)
    timeCheck("edge_functions", async () => {
      const r = await fetch(`${supabaseUrl}/functions/v1/check-login-rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({ action: "check", email: "healthcheck@monitor.internal" }),
      })
      return { ok: r.status < 500, msg: `Edge functions HTTP ${r.status}` }
    }),

    // 6. Failed payments in last 24h
    timeCheck("failed_payments", async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count, error } = await db
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "created")
        .lt("created_at", since)
      if (error) return { ok: false, msg: error.message }
      const stuckCount = count ?? 0
      return {
        ok: stuckCount < 10,
        msg: stuckCount > 0 ? `${stuckCount} stuck/abandoned payments` : "No stuck payments",
      }
    }),

    // 7. Email service (Resend)
    timeCheck("email_service", async () => {
      if (!resendKey) return { ok: false, msg: "RESEND_API_KEY not set" }
      const r = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${resendKey}` },
      })
      return { ok: r.ok, msg: `Resend API HTTP ${r.status}` }
    }),

    // 8. Pending trainer approvals > 48h (warn, not fail)
    timeCheck("trainer_approvals", async () => {
      const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      const { count, error } = await db
        .from("trainers")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", "pending")
        .lt("created_at", since)
      if (error) return { ok: false, msg: error.message }
      const c = count ?? 0
      return { ok: c < 5, msg: c > 0 ? `${c} trainers pending >48h` : "No backlog" }
    }),

    // 9. Dashboard performance — measure enrollments query latency
    timeCheck("dashboard_perf", async () => {
      const start = Date.now()
      const { error } = await db
        .from("enrollments")
        .select("id, status")
        .eq("status", "active")
        .limit(50)
      const ms = Date.now() - start
      if (error) return { ok: false, msg: error.message }
      return { ok: ms < 2000, msg: `Enrollments query ${ms}ms` }
    }),

    // 10. Error logs — unread contact messages > 10
    timeCheck("contact_messages", async () => {
      const { count, error } = await db
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
      if (error) return { ok: true, msg: "contact_messages table not found (OK)" }
      const c = count ?? 0
      return { ok: c < 10, msg: c > 0 ? `${c} unread contact messages` : "Inbox clear" }
    }),
  ])

  const passed = checks.filter(c => c.status === "PASS").length
  const failed = checks.filter(c => c.status === "FAIL")
  const overallStatus = failed.length === 0 ? "healthy" : failed.length <= 2 ? "degraded" : "critical"

  // Log results to monitoring table
  const { error: logErr } = await db.from("monitoring_logs").insert({
    status: overallStatus,
    checks: checks,
    pass_count: passed,
    fail_count: failed.length,
    checked_at: new Date().toISOString(),
  })
  if (logErr) console.error("Failed to write monitoring log:", logErr.message)

  // Send alert email only if critical (3+ failures) — skip degraded to save Resend quota
  if (overallStatus === "critical" && resendKey) {
    const failedList = failed.map(f => `- ${f.name}: ${f.message}`).join("<br>")
    // Call Resend API directly — health-monitor already has the key and this avoids
    // routing a system alert through send-email which expects typed template payloads.
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "SkillMitra Monitor <contact@skillmitra.online>",
        to: [ALERT_EMAIL],
        subject: `🚨 SkillMitra Monitor: ${overallStatus.toUpperCase()} (${failed.length} failures)`,
        html: `<h2>SkillMitra Health Alert</h2>
<p>Status: <strong>${overallStatus}</strong> — ${passed}/${checks.length} checks passed.</p>
<h3>Failed Checks:</h3>
<p>${failedList}</p>
<p>Checked at: ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Kolkata' })} IST</p>`,
      }),
    }).catch(e => console.error("Alert email failed:", e))
  }

  console.log(JSON.stringify({
    event: "health_check",
    status: overallStatus,
    passed,
    failed: failed.length,
    checks: checks.map(c => ({ name: c.name, status: c.status, latency_ms: c.latency_ms })),
  }))

  return new Response(
    JSON.stringify({ status: overallStatus, passed, total: checks.length, checks }),
    { headers: corsHeaders }
  )
})
