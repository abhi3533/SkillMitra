/**
 * Formats a UTC ISO string to IST for display in emails.
 * Output: "Monday, 14 April 2026 at 6:00 PM IST"
 */
export function formatIST(isoString: string): string {
  const date = new Date(isoString);
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  const weekday = get("weekday");
  const day = get("day");
  const month = get("month");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");
  const dayPeriod = get("dayPeriod").toUpperCase();

  return `${weekday}, ${day} ${month} ${year} at ${hour}:${minute} ${dayPeriod} IST`;
}
