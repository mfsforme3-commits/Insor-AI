export function formatRelativeTime(isoDate: string): string {
  if (!isoDate) return "just now";
  const value = new Date(isoDate).getTime();
  if (Number.isNaN(value)) return "just now";

  const diff = value - Date.now();
  const absoluteDiff = Math.abs(diff);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["week", 1000 * 60 * 60 * 24 * 7],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
    ["second", 1000]
  ];

  for (const [unit, milliseconds] of units) {
    if (absoluteDiff >= milliseconds || unit === "second") {
      const value = Math.round(diff / milliseconds);
      const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
      return formatter.format(value, unit);
    }
  }

  return "just now";
}
