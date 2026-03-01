/**
 * Converts raw Supabase/network errors into user-friendly messages.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!error) return "An unknown error occurred.";

  const msg = (error as any)?.message ?? String(error);

  // Network-level failures
  if (msg === "Failed to fetch" || msg.includes("NetworkError") || msg.includes("net::ERR")) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  // Supabase-specific auth errors
  if (msg.includes("Invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (msg.includes("Email not confirmed")) {
    return "Please verify your email address before signing in. Check your inbox for a confirmation link.";
  }
  if (msg.includes("User already registered")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (msg.includes("Password should be at least")) {
    return "Password must be at least 6 characters long.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (msg.includes("Email rate limit exceeded")) {
    return "Too many signup attempts. Please wait a few minutes and try again.";
  }

  return msg;
}
