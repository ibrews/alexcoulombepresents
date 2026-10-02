// ── Member invite sweep — pure orchestration ───────────────────────────────
// Decision 2026-10-02: paid-up members are invited to EVERY scheduled class
// and the current office hours immediately (schedule publish, membership
// renewal), not at the next daily cron. All I/O arrives via `deps` so the
// sweep is unit-testable with no Zoom/DB; lib/memberInvites.ts wires the live
// deps. No runtime imports here, by design.

export type Person = { email: string; name?: string | null };

export type InviteDeps = {
  /** Dated classes from wednesdayCalendar. */
  classes: { slug: string; zoomMeetingId?: string; sessionDateISO?: string }[];
  activeMemberContacts(): Promise<Person[]>;
  currentOfficeHoursMeetingId(): Promise<string | null>;
  ensureZoomRegistrants(
    meetingId: string,
    people: Person[]
  ): Promise<{ registered: string[]; skipped: string[]; failed: string[] }>;
  /** Alex's inboxes + standing attendees, always on every session. */
  alwaysInvite: Person[];
  now?: () => Date;
};

export type InviteMeetingResult = {
  target: string; // class slug or "office-hours"
  meetingId?: string;
  action: "invited" | "no-meeting" | "past" | "error";
  registered: number;
  skipped: number;
  failed: number;
};

export type InviteSweepResult = {
  ok: boolean;
  results: InviteMeetingResult[];
};

export async function runInviteSweep(
  deps: InviteDeps,
  opts: { onlyEmails?: string[] } = {}
): Promise<InviteSweepResult> {
  const now = (deps.now ?? (() => new Date()))();

  let people: Person[];
  if (opts.onlyEmails) {
    // Targeted (renewal) mode: just this member, plus the always-invited
    // contacts, which are already registered and so skipped by Zoom diffing.
    people = opts.onlyEmails.filter(Boolean).map((email) => ({ email }));
    if (people.length === 0) return { ok: true, results: [] };
    // Pick up the display name when we have one, so Zoom gets a real name.
    try {
      const members = await deps.activeMemberContacts();
      const byEmail = new Map(members.map((m) => [m.email.toLowerCase(), m]));
      people = people.map((p) => byEmail.get(p.email.toLowerCase()) ?? p);
    } catch {
      /* name is cosmetic; proceed with bare emails */
    }
  } else {
    people = await deps.activeMemberContacts(); // throws → caller reports
  }
  const everyone = [...deps.alwaysInvite, ...people];

  const results: InviteMeetingResult[] = [];
  let ok = true;

  const invite = async (target: string, meetingId: string) => {
    try {
      const r = await deps.ensureZoomRegistrants(meetingId, everyone);
      if (r.failed.length) ok = false;
      results.push({
        target,
        meetingId,
        action: "invited",
        registered: r.registered.length,
        skipped: r.skipped.length,
        failed: r.failed.length,
      });
    } catch (err) {
      console.error(`[member-invites] sweep failed for ${target}`, err);
      ok = false;
      results.push({ target, meetingId, action: "error", registered: 0, skipped: 0, failed: 0 });
    }
  };

  for (const item of deps.classes) {
    if (!item.zoomMeetingId || !item.sessionDateISO) {
      results.push({ target: item.slug, action: "no-meeting", registered: 0, skipped: 0, failed: 0 });
      continue;
    }
    if (new Date(item.sessionDateISO) <= now) {
      results.push({ target: item.slug, action: "past", registered: 0, skipped: 0, failed: 0 });
      continue;
    }
    await invite(item.slug, item.zoomMeetingId);
  }

  try {
    const officeHoursId = await deps.currentOfficeHoursMeetingId();
    if (officeHoursId) await invite("office-hours", officeHoursId);
    else results.push({ target: "office-hours", action: "no-meeting", registered: 0, skipped: 0, failed: 0 });
  } catch (err) {
    console.error("[member-invites] office hours lookup failed", err);
    ok = false;
    results.push({ target: "office-hours", action: "error", registered: 0, skipped: 0, failed: 0 });
  }

  return { ok, results };
}
