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

// The public support address, and the only Resend-verified sending domain —
// every `from` stays on it.
export const OWNER_EMAIL = "info@alexcoulombepresents.com";

/**
 * Every address that should receive an owner alert, an owner `bcc`, or a
 * customer's reply — the one list all senders share.
 *
 * `OWNER_EMAIL` is an alias for a Gmail account that isn't watched day to day,
 * so alerts addressed only there were delivered correctly and read by nobody:
 * four class sales, a new member signup, and every contact-form inquiry went
 * unseen for three weeks, with Resend reporting all of them `delivered`, which
 * is exactly why nothing looked broken. `OWNER_ALERT_EMAIL` names the inbox
 * actually read, and lives in the environment rather than in source because
 * this repo is public and that address is on an unrelated domain.
 *
 * Unset (or malformed) → owner mail goes to `OWNER_EMAIL` alone, exactly as it
 * did before. Read lazily, per-send, so a deploy that adds the variable takes
 * effect without a module-init order dependency.
 */
export function ownerRecipients(): string[] {
  const extra = process.env.OWNER_ALERT_EMAIL?.trim();
  return extra && isValidEmail(extra) ? [extra, OWNER_EMAIL] : [OWNER_EMAIL];
}

/**
 * `from` for owner-only alerts — the ones whose every recipient is us.
 *
 * Deliberately NOT the info@ support address those alerts are sent *to*:
 * From == To on mail arriving through an external relay is a spoofing
 * signature, and on 2026-09-10 Gmail began filing these in Spam (the two
 * `FULFILL:` alerts for that day's class sales landed there, while the
 * otherwise-identical Aug 12/19/26 ones had reached the inbox). Customer-facing
 * mail keeps the info@ `from` — it's addressed to the customer, so it never had
 * this problem.
 */
export const OWNER_ALERT_FROM = "Alex Coulombe Presents <noreply@alexcoulombepresents.com>";
