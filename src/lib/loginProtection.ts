import { supabase } from "@/integrations/supabase/client";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

interface LoginAttemptData {
  count: number;
  lockedUntil: number | null;
}

const getKey = (email: string) => `login-attempts-${email.toLowerCase().trim()}`;

// ─── Local cache helpers (fast UX feedback) ───────────────────────────────────

function localCheck(email: string): { locked: boolean; minutesLeft: number } {
  try {
    const raw = localStorage.getItem(getKey(email));
    if (!raw) return { locked: false, minutesLeft: 0 };
    const data: LoginAttemptData = JSON.parse(raw);
    if (data.lockedUntil && Date.now() < data.lockedUntil) {
      const minutesLeft = Math.ceil((data.lockedUntil - Date.now()) / 60000);
      return { locked: true, minutesLeft };
    }
    if (data.lockedUntil && Date.now() >= data.lockedUntil) {
      localStorage.removeItem(getKey(email));
    }
    return { locked: false, minutesLeft: 0 };
  } catch {
    return { locked: false, minutesLeft: 0 };
  }
}

function localRecord(email: string): { locked: boolean; minutesLeft: number } {
  try {
    const raw = localStorage.getItem(getKey(email));
    let data: LoginAttemptData = raw ? JSON.parse(raw) : { count: 0, lockedUntil: null };
    if (data.lockedUntil && Date.now() >= data.lockedUntil) {
      data = { count: 0, lockedUntil: null };
    }
    data.count += 1;
    if (data.count >= MAX_ATTEMPTS) {
      data.lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
      localStorage.setItem(getKey(email), JSON.stringify(data));
      return { locked: true, minutesLeft: LOCKOUT_MINUTES };
    }
    localStorage.setItem(getKey(email), JSON.stringify(data));
    return { locked: false, minutesLeft: 0 };
  } catch {
    return { locked: false, minutesLeft: 0 };
  }
}

// ─── Server-side helpers (actual enforcement) ─────────────────────────────────

async function serverCall(
  action: "check" | "record" | "clear",
  email: string
): Promise<{ locked: boolean; minutesLeft: number }> {
  try {
    const { data, error } = await supabase.functions.invoke("check-login-rate", {
      body: { action, email },
    });
    if (error || !data) return { locked: false, minutesLeft: 0 };
    return { locked: !!data.locked, minutesLeft: data.minutesLeft ?? 0 };
  } catch {
    // Fail open — never block user due to our own network error
    return { locked: false, minutesLeft: 0 };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check if login is locked for this email.
 * Returns fast via localStorage, then verifies server-side.
 */
export async function checkLoginLocked(
  email: string
): Promise<{ locked: boolean; minutesLeft: number }> {
  const local = localCheck(email);
  if (local.locked) return local;           // Fast path: already locked locally

  // Authoritative server check (prevents localStorage bypass)
  return serverCall("check", email);
}

/**
 * Record a failed login attempt.
 * Updates both localStorage (for immediate UI) and the server (for enforcement).
 */
export async function recordFailedAttempt(
  email: string
): Promise<{ locked: boolean; minutesLeft: number }> {
  const local = localRecord(email);         // Update localStorage immediately
  const server = await serverCall("record", email); // Record server-side

  // Return the more restrictive result
  if (server.locked) return server;
  return local;
}

/**
 * Clear login attempt tracking after a successful login.
 */
export async function clearLoginAttempts(email: string): Promise<void> {
  localStorage.removeItem(getKey(email));
  await serverCall("clear", email);         // Fire-and-forget is fine here
}
