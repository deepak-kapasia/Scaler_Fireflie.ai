/**
 * Utility helpers
 */

/**
 * Format seconds → MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Format seconds as label: "47 min", "1h 12m"
 */
export function formatDurationLabel(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

/**
 * Format ISO date string to display: "Aug 13, 2026"
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Format ISO date string to relative: "2 days ago", "today", etc.
 */
export function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Convert seconds to timestamp string: 0 → "0:00", 65 → "1:05"
 */
export function secondsToTimestamp(seconds: number): string {
  return formatDuration(Math.floor(seconds));
}

/**
 * Parse "MM:SS" or "HH:MM:SS" to seconds
 */
export function timestampToSeconds(ts: string): number {
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate a unique ID (for client-side use)
 */
export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Highlight text matches in a string (returns HTML)
 */
export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return escapeHtml(text);
  const escaped = escapeRegex(query);
  const regex = new RegExp(`(${escaped})`, "gi");
  return escapeHtml(text).replace(
    new RegExp(`(${escapeRegex(escapeHtml(query))})`, "gi"),
    '<mark class="bg-amber-200 text-amber-900 rounded px-0.5">$1</mark>'
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Count query matches in text (case-insensitive)
 */
export function countMatches(text: string, query: string): number {
  if (!query.trim()) return 0;
  const regex = new RegExp(escapeRegex(query), "gi");
  return (text.match(regex) ?? []).length;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce a function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
