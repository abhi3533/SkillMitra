/**
 * IST (Indian Standard Time) formatting utilities.
 * All dates stored in UTC are displayed in IST (UTC+5:30).
 */

const IST_TIMEZONE = "Asia/Kolkata";

/** Format: "10 Mar 2026, 11:01 AM IST" */
export const formatDateTimeIST = (date: string | Date, options?: { showSeconds?: boolean }): string => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const formatted = d.toLocaleString("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(options?.showSeconds ? { second: "2-digit" } : {}),
    hour12: true,
  });
  return `${formatted} IST`;
};

/** Format: "10 Mar 2026" */
export const formatDateIST = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    timeZone: IST_TIMEZONE,
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
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${formatted} IST`;
};

/** Format: "Mon, 10 Mar" (short, no year) */
export const formatShortDateIST = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    timeZone: IST_TIMEZONE,
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
    timeZone: IST_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${formatted} IST`;
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
    timeZone: IST_TIMEZONE,
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
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
