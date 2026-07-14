// Temporal-key helpers shared by the timeline components.
//
// The year-based tabs (Adidas, Trump) key everything on `year`. The Retroactive
// Discovery / COVID-19 tab adds an optional `month` (1–12) so multiple points
// can share a year. These helpers give every component a single, sortable key
// and a human label that degrade to plain year behaviour when `month` is
// absent — so the existing tabs render exactly as before.

type Periodish = {
  year: number;
  month?: number | null;
  period_label?: string | null;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function hasMonth(p: Periodish): p is Periodish & { month: number } {
  return typeof p.month === "number" && p.month >= 1 && p.month <= 12;
}

// A single numeric key that is unique per point and sorts chronologically.
// Year-only points collapse to the plain year (unchanged behaviour); month
// points become year*100+month (e.g. 202001) which is still monotonic.
export function pointKey(p: Periodish): number {
  return hasMonth(p) ? p.year * 100 + p.month : p.year;
}

// Human label for a point: an explicit `period_label` wins; otherwise
// "Mon YYYY" when a month is present, else the bare year.
export function pointLabel(p: Periodish): string {
  if (p.period_label) return p.period_label;
  if (hasMonth(p)) return `${MONTHS[p.month - 1]} ${p.year}`;
  return String(p.year);
}

// Short label without the year — for dense axes/strips where the year is
// shown once elsewhere. Falls back to the full label.
export function pointShortLabel(p: Periodish): string {
  if (hasMonth(p)) return MONTHS[p.month - 1];
  return pointLabel(p);
}
