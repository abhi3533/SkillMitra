// Slot band helpers — single source of truth for booking time bands.
// Each band is a contiguous set of 1-hour slots. A booking always reserves
// exactly one 1-hour sub-slot inside one of these bands.

export type SlotBand = "morning" | "day" | "evening";

export interface SlotBandConfig {
  id: SlotBand;
  label: string;
  description: string;
  startHour: number; // inclusive
  endHour: number;   // exclusive
}

export const SLOT_BANDS: SlotBandConfig[] = [
  { id: "morning", label: "Morning", description: "06:00 – 09:00", startHour: 6, endHour: 9 },
  { id: "day",     label: "Day",     description: "09:00 – 16:00", startHour: 9, endHour: 16 },
  { id: "evening", label: "Evening", description: "16:00 – 21:00", startHour: 16, endHour: 21 },
];

export const ALL_BAND_IDS: SlotBand[] = SLOT_BANDS.map(b => b.id);

export function getBandConfig(id: string): SlotBandConfig | undefined {
  return SLOT_BANDS.find(b => b.id === id);
}

export function bandForHour(hour: number): SlotBand | null {
  const b = SLOT_BANDS.find(b => hour >= b.startHour && hour < b.endHour);
  return b ? b.id : null;
}

/** Returns all 1-hour slot starting hours allowed by the supplied bands. */
export function hoursForBands(bands: string[] | null | undefined): number[] {
  if (!bands || bands.length === 0) return [];
  const set = new Set<number>();
  for (const id of bands) {
    const cfg = getBandConfig(id);
    if (!cfg) continue;
    for (let h = cfg.startHour; h < cfg.endHour; h++) set.add(h);
  }
  return [...set].sort((a, b) => a - b);
}

export function formatHourLabel(hour: number): string {
  const h12 = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h12}:00 ${ampm}`;
}

/**
 * Build the recurring weekly date list starting from `startDate` for `count`
 * sessions on the given weekday + hour. Returns Date objects in IST-ish local
 * (we set hour at the local-machine TZ). We always pick the first occurrence
 * of `weekday` on or after `startDate`.
 */
export function buildWeeklySessionDates(opts: {
  startDate: Date;        // course_start_date
  weekday: number;        // 0 (Sun) – 6 (Sat)
  hour: number;           // 0 – 23
  count: number;          // total sessions
}): Date[] {
  const { startDate, weekday, hour, count } = opts;
  const first = new Date(startDate);
  first.setHours(hour, 0, 0, 0);
  const diff = (weekday - first.getDay() + 7) % 7;
  first.setDate(first.getDate() + diff);
  const out: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() + i * 7);
    out.push(d);
  }
  return out;
}

/** YYYY-MM-DD in local time (used for DB DATE column comparisons). */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const WEEKDAY_LABELS = [
  { value: 0, short: "Sun", long: "Sunday" },
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
];
