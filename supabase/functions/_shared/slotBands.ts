// Edge-function copy of slot band helpers (Deno can't import from src/).
export type SlotBand = "morning" | "day" | "evening";

export interface SlotBandConfig {
  id: SlotBand;
  label: string;
  startHour: number;
  endHour: number;
}

export const SLOT_BANDS: SlotBandConfig[] = [
  { id: "morning", label: "Morning", startHour: 6, endHour: 9 },
  { id: "day",     label: "Day",     startHour: 9, endHour: 16 },
  { id: "evening", label: "Evening", startHour: 16, endHour: 21 },
];

export function bandForHour(hour: number): SlotBand | null {
  const b = SLOT_BANDS.find(b => hour >= b.startHour && hour < b.endHour);
  return b ? b.id : null;
}

export function isHourInBands(hour: number, bands: string[]): boolean {
  if (!bands || bands.length === 0) return false;
  return bands.some(id => {
    const cfg = SLOT_BANDS.find(b => b.id === id);
    return !!cfg && hour >= cfg.startHour && hour < cfg.endHour;
  });
}

export function buildWeeklySessionDates(opts: {
  startDate: Date;
  weekday: number;
  hour: number;
  count: number;
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

/**
 * Build session dates honouring sessions_per_week and frequency.
 * - frequency "daily" + sessionsPerWeek N: schedule N sessions per week
 *   on consecutive weekdays starting from the first session's weekday.
 *   E.g. start Mon, N=5 → Mon Tue Wed Thu Fri, then next Mon…
 * - frequency "weekly" (or sessionsPerWeek <=1): one session per week
 *   on the same weekday (legacy behaviour).
 */
export function buildScheduledSessionDates(opts: {
  startDate: Date;        // first session date+hour (already validated)
  hour: number;
  count: number;
  sessionsPerWeek?: number;
  frequency?: string | null;
}): Date[] {
  const { startDate, hour, count } = opts;
  const sessionsPerWeek = Math.max(1, Math.min(7, Number(opts.sessionsPerWeek) || 1));
  const freq = (opts.frequency || "weekly").toLowerCase();

  const first = new Date(startDate);
  first.setHours(hour, 0, 0, 0);

  // Weekly mode (or 1/week): same weekday each week
  if (sessionsPerWeek <= 1 || freq === "weekly") {
    const out: Date[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(first);
      d.setDate(first.getDate() + i * 7);
      out.push(d);
    }
    return out;
  }

  // Daily / multi-per-week mode: N consecutive days starting from `first`'s
  // weekday, then skip to next week's same starting weekday.
  const out: Date[] = [];
  let weekStart = new Date(first);
  let produced = 0;
  while (produced < count) {
    for (let i = 0; i < sessionsPerWeek && produced < count; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      d.setHours(hour, 0, 0, 0);
      out.push(d);
      produced++;
    }
    weekStart.setDate(weekStart.getDate() + 7);
  }
  return out;
}

export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
