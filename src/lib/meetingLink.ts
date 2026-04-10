/**
 * Generates a unique Jitsi Meet link for a session.
 * Jitsi is free, requires no API key, and works without accounts.
 */
export function generateMeetLink(courseTitle: string, sessionNumber?: number): string {
  const slug = courseTitle
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 30);

  const uniqueId = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const sessionTag = sessionNumber ? `-s${sessionNumber}` : "";

  return `https://meet.jit.si/skillmitra-${slug}${sessionTag}-${uniqueId}`;
}
