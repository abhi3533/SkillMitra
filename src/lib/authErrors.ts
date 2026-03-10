/**
 * Converts raw auth/network errors into friendly messages.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!error) return "Something went wrong. Please try again.";

  const msg = (error as any)?.message ?? String(error);

  // Network failures
  if (msg === "Failed to fetch" || msg.includes("NetworkError") || msg.includes("net::ERR")) {
    return "Can't connect to the server. Please check your internet and try again.";
  }

  // Auth errors
  if (msg.includes("Invalid login credentials")) {
    return "Wrong email or password. Please check and try again.";
  }
  if (msg.includes("Email not confirmed")) {
    return "Please verify your email first. Check your inbox for a confirmation link.";
  }
  if (msg.includes("User already registered")) {
    return "This email is already registered. Try signing in instead.";
  }
  if (msg.includes("Password should be at least")) {
    return "Password must be at least 6 characters.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (msg.includes("Email rate limit exceeded")) {
    return "Too many tries. Please wait a few minutes and try again.";
  }

  return msg;
}
