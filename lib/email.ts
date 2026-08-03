// Single source of truth for "is this a sendable email address" — used at
// signup time (lib/db.ts), and by every script that diffs/sends against the
// signups table (Newsletter Studio, manual-send-kit). One malformed address
// stored without a "." (e.g. "amy@cosmokitty,com") silently poisoned an
// entire 100-recipient Resend batch; catching the shape here is cheaper than
// discovering it mid-send.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}
