// Live wiring for the member invite sweep (logic + tests: memberInvitesCore.ts).
// Callers: the daily class-member-invites cron, POST /api/admin/invite-members
// (run right after publishing new classes), and the Stripe webhook on
// membership grant/renewal (via MembershipBillingDeps).

import { wednesdayCalendar } from "./store.ts";
import { ensureZoomRegistrants, currentOfficeHoursMeetingId, STANDING_ATTENDEES, OWNER_INVITE_CONTACTS } from "./zoom.ts";
import { activeMemberContacts } from "./commerce/entitlements.ts";
import { runInviteSweep, type InviteSweepResult } from "./memberInvitesCore.ts";

export type { InviteSweepResult } from "./memberInvitesCore.ts";

/** Register paid-up members (or only `onlyEmails`) plus Alex + standing
 * attendees on every upcoming dated class and the current office hours.
 * Zoom's own registrant list is diffed first, so re-runs never re-mail. */
export function inviteMembersToUpcomingSessions(opts: { onlyEmails?: string[] } = {}): Promise<InviteSweepResult> {
  return runInviteSweep(
    {
      classes: wednesdayCalendar,
      activeMemberContacts,
      currentOfficeHoursMeetingId,
      ensureZoomRegistrants,
      alwaysInvite: [...OWNER_INVITE_CONTACTS, ...STANDING_ATTENDEES],
    },
    opts
  );
}
