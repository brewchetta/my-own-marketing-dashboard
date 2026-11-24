// "2026-11-16/2026-11-22" → "Nov 16 – Nov 22, 2026"
export function formatPeriod(period: string) {
  const [start, end] = period.split("/");
  if (!start || !end) return period;
  const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
  return `${fmt(start, { month: "short", day: "numeric" })} – ${fmt(end, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}
