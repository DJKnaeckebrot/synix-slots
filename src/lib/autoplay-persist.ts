const STORAGE_KEY = "rank-rush-autoplay";
const COOKIE_NAME = "rank_rush_autoplay";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  // biome-ignore lint/suspicious/noDocumentCookie: intentional client preference cookie
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  // biome-ignore lint/suspicious/noDocumentCookie: intentional client preference cookie
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function parseCount(raw: string | null): number {
  if (raw == null || raw === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  // -1 = infinite; otherwise non-negative integer
  if (n === -1) return -1;
  if (n <= 0) return 0;
  return Math.floor(n);
}

/** Restore autoplay counter from localStorage (preferred) or cookie. */
export function readPersistedAutoplay(): number {
  if (typeof window === "undefined") return 0;
  try {
    const fromStorage = parseCount(window.localStorage.getItem(STORAGE_KEY));
    if (fromStorage !== 0) return fromStorage;
  } catch {
    // private mode / blocked storage
  }
  return parseCount(readCookie(COOKIE_NAME));
}

/** Persist autoplay counter so free-game / rank-up chains survive reloads. */
export function persistAutoplay(count: number): void {
  if (typeof window === "undefined") return;
  if (count === 0) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    clearCookie(COOKIE_NAME);
    return;
  }
  const value = String(count);
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
  writeCookie(COOKIE_NAME, value, MAX_AGE_SECONDS);
}
