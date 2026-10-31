/** Small display helpers shared by the admin and member pages. */

const TONES = ['', 'c2', 'c3', 'c4', 'c5'] as const;

/** First + last initial, for avatar circles. */
export function initials(name: string | null | undefined): string {
  const p = (name ?? '').trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
}

/** Stable avatar tint per name, so a person keeps the same colour on every page. */
export function tone(name: string | null | undefined): string {
  let h = 0;
  for (const ch of name ?? '') h = (h * 31 + ch.charCodeAt(0)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

/** "Oct 28" */
export function shortDate(d: Date | null | undefined): string {
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
}

/** "Oct 28, 2026" */
export function fullDate(d: Date | null | undefined): string {
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

/** "Thursday, October 29" */
export function longDay(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** "4:51 PM" */
export function clock(d: Date | null | undefined): string {
  return d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
}

/** "12m", "3h", "Yesterday", "Oct 24" */
export function ago(ms: number, now = Date.now()): string {
  const min = Math.round((now - ms) / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h`;
  if (h < 48) return 'Yesterday';
  return shortDate(new Date(ms));
}

/** The studio's calendar day (PST) as yyyy-MM-dd — the same key check-ins are stored under. */
export function studioDay(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}
