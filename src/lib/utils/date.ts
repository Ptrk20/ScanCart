function validDate(timestamp: string): Date {
  const value = new Date(timestamp);
  if (!Number.isFinite(value.getTime())) throw new TypeError("Invalid shopping date.");
  return value;
}

export function formatShoppingDate(timestamp: string): string {
  return new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "long", day: "numeric" }).format(validDate(timestamp));
}

export function formatShoppingDateTime(timestamp: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
  }).format(validDate(timestamp));
}
