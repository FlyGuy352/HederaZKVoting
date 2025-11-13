export function formatIsoToLocalString(isoStr: string): string {
  const date = new Date(isoStr);
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: userTimeZone,
  };

  const formatted = new Intl.DateTimeFormat(undefined, options).format(date);

  return `${formatted} (${userTimeZone})`;
}