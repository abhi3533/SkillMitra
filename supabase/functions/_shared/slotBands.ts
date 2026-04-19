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

export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
