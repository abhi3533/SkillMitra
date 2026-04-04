/**
 * Timezone-aware formatting utilities.
 * Detects user's local timezone automatically.
 * All dates stored in UTC are displayed in the user's local timezone.
 */

/** Always use IST (Indian Standard Time) */
const getUserTimezone = (): string => "Asia/Kolkata";

/** Get short timezone abbreviation for display */
const getTimezoneAbbr = (date: Date, tz: string): string => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(date);
    const tzPart = parts.find(p => p.type === "timeZoneName");
    return tzPart?.value || "IST";
  } catch {
    return "IST";
  }
};

const TZ = getUserTimezone();

/** Format: "10 Mar 2026, 11:01 AM IST" */
export const formatDateTimeIST = (date: string | Date, options?: { showSeconds?: boolean }): string => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const formatted = d.toLocaleString("en-IN", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(options?.showSeconds ? { second: "2-digit" } : {}),
    hour12: true,
  });
  return `${formatted} ${getTimezoneAbbr(d, TZ)}`;
};

/** Format: "10 Mar 2026" */
export const formatDateIST = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
};

/** Format: "11:01 AM IST" */
export const formatTimeIST = (date: string | Date): string => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const formatted = d.toLocaleTimeString("en-IN", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${formatted} ${getTimezoneAbbr(d, TZ)}`;
};

/** Format: "Mon, 10 Mar" (short, no year) */
export const formatShortDateIST = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    ...options,
  });
};

/** Format: "Mon, 10 Mar, 11:01 AM IST" (with weekday) */
export const formatDateTimeWeekdayIST = (date: string | Date): string => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const formatted = d.toLocaleString("en-IN", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${formatted} ${getTimezoneAbbr(d, TZ)}`;
};

/** Relative time: "5m ago", "3h ago", "2d ago" */
export const timeAgoIST = (date: string | Date): string => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

/** Get date key for grouping: "Monday, 10 March" */
export const getDateGroupKeyIST = (date: string | Date): string => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

/** Format for long date: "10 March 2026" */
export const formatLongDateIST = (date: string | Date): string => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/** Generate Google Calendar URL for a session */
export const generateGoogleCalendarUrl = (params: {
  title: string;
  startDate: string | Date;
  durationMins: number;
  description?: string;
  location?: string;
}): string => {
  const start = new Date(params.startDate);
  const end = new Date(start.getTime() + params.durationMins * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", params.title);
  url.searchParams.set("dates", `${fmt(start)}/${fmt(end)}`);
  if (params.description) url.searchParams.set("details", params.description);
  if (params.location) url.searchParams.set("location", params.location);
  return url.toString();
};

/** Generate Outlook Calendar URL for a session */
export const generateOutlookCalendarUrl = (params: {
  title: string;
  startDate: string | Date;
  durationMins: number;
  description?: string;
  location?: string;
}): string => {
  const start = new Date(params.startDate);
  const end = new Date(start.getTime() + params.durationMins * 60000);
  const url = new URL("https://outlook.live.com/calendar/0/action/compose");
  url.searchParams.set("rru", "addevent");
  url.searchParams.set("subject", params.title);
  url.searchParams.set("startdt", start.toISOString());
  url.searchParams.set("enddt", end.toISOString());
  if (params.description) url.searchParams.set("body", params.description);
  if (params.location) url.searchParams.set("location", params.location);
  url.searchParams.set("path", "/calendar/action/compose");
  return url.toString();
};
