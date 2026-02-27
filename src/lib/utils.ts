export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  if (diffWeek < 52) return `${diffWeek}w`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}
