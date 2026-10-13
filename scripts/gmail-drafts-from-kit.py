#!/usr/bin/env python3
"""Turn a manual send kit into ready-to-send Gmail drafts in the ACP Gmail.

    PY=~/dev/amex-reconciler/.venv/bin/python   # has `keyring`
    $PY scripts/gmail-drafts-from-kit.py <slug> [--groups 4]   # make the drafts
    $PY scripts/gmail-drafts-from-kit.py <slug> --check-sent   # which batches went out

Run `node scripts/manual-send-kit.mjs <slug>` first: it writes
.manual-send/<slug>/newsletter.html and group-N.txt (everyone email_events
can't confirm got the issue). This script re-splits those addresses into
--groups batches of at most 90 (Gmail's composer rejects much more), rewrites
the group files to match, and appends one draft per batch to the account's
"[Gmail]/Drafts" over IMAP: From the account, Bcc only, the full HTML.

Why IMAP and not the Gmail connector: the connector's create_draft strips
every <img> and rewrites every link through google.com/url, so its drafts
can't be sent as a newsletter. IMAP APPEND stores the message untouched.

Credentials: the account's app password lives in macOS Keychain under service
"amex-reconciler-imap" (set up for ~/dev/amex-reconciler). It is read here and
never printed.

After sending, --check-sent matches each sent message's Bcc to a group file;
then run `node scripts/manual-send-kit.mjs <slug> --record N` for each.
"""
import argparse, email, imaplib, re, sys, time
from email import policy
from email.message import EmailMessage
from email.utils import formatdate, make_msgid
from pathlib import Path

import keyring

ACCOUNT = "alexcoulombepresents@gmail.com"
FROM = "Alex Coulombe Presents <alexcoulombepresents@gmail.com>"
KEYRING_SERVICE = "amex-reconciler-imap"
MAX_PER_DRAFT = 90
ROOT = Path(__file__).resolve().parent.parent
ADDR = re.compile(r"[\w.+'-]+@[\w.-]+")


def read_kit(slug):
    kit = ROOT / ".manual-send" / slug
    readme = (kit / "README.txt").read_text()
    subject = readme.split("Subject line (paste into Gmail's Subject field):\n", 1)[1].splitlines()[0].strip()
    groups = sorted(kit.glob("group-*.txt"), key=lambda p: int(p.stem.split("-")[1]))
    return kit, subject, groups


def addresses(path):
    return [e.strip() for e in path.read_text().split(",") if e.strip()]


def connect():
    password = keyring.get_password(KEYRING_SERVICE, ACCOUNT)
    if not password:
        sys.exit(f"No app password in Keychain for {ACCOUNT} (service {KEYRING_SERVICE}).")
    imap = imaplib.IMAP4_SSL("imap.gmail.com")
    imap.login(ACCOUNT, password)
    return imap


def make_drafts(slug, n_groups):
    kit, subject, files = read_kit(slug)
    everyone = [a for f in files for a in addresses(f)]
    if len(set(everyone)) != len(everyone):
        sys.exit("Duplicate addresses across group files — rebuild the kit first.")
    size = -(-len(everyone) // n_groups)
    if size > MAX_PER_DRAFT:
        sys.exit(f"{len(everyone)} recipients in {n_groups} drafts is {size} each; use more --groups (max {MAX_PER_DRAFT}).")
    batches = [everyone[i * size:(i + 1) * size] for i in range(n_groups)]
    for f in files:
        f.unlink()
    for i, batch in enumerate(batches, 1):
        (kit / f"group-{i}.txt").write_text(", ".join(batch))

    html = (kit / "newsletter.html").read_text()
    plain = f"{subject}\n\nRead it online: https://alexcoulombepresents.com/newsletter/{slug}\n"
    imap = connect()
    for batch in batches:
        msg = EmailMessage()
        msg["From"], msg["Bcc"], msg["Subject"] = FROM, ", ".join(batch), subject
        msg["Date"], msg["Message-ID"] = formatdate(localtime=True), make_msgid(domain="gmail.com")
        msg.set_content(plain)
        msg.add_alternative(html, subtype="html")
        imap.append('"[Gmail]/Drafts"', r"(\Draft \Seen)", imaplib.Time2Internaldate(time.time()), msg.as_bytes())

    # Verify what Gmail actually stored, not what was sent to it.
    imap.select('"[Gmail]/Drafts"', readonly=True)
    _, found = imap.search(None, "SUBJECT", f'"{subject}"')
    wanted = [set(a.lower() for a in b) for b in batches]
    ok = []
    for mid in found[0].split():
        _, data = imap.fetch(mid, "(BODY.PEEK[])")
        m = email.message_from_bytes(data[0][1], policy=policy.default)
        bcc = set(a.lower() for a in ADDR.findall(m.get("Bcc", "")))
        body = m.get_body(("html",)).get_content()
        if bcc in wanted and body.count("<img") == html.count("<img") and "google.com/url" not in body:
            ok.append(wanted.index(bcc) + 1)
    imap.logout()
    print(f"{len(batches)} drafts in {ACCOUNT}: {[len(b) for b in batches]} recipients; verified batches {sorted(ok)}")
    if sorted(ok) != list(range(1, len(batches) + 1)):
        sys.exit("Verification failed — check the Drafts folder before sending anything.")


def check_sent(slug):
    kit, subject, files = read_kit(slug)
    groups = {int(f.stem.split("-")[1]): set(a.lower() for a in addresses(f)) for f in files}
    imap = connect()
    imap.select('"[Gmail]/Sent Mail"', readonly=True)
    _, found = imap.search(None, "SUBJECT", f'"{subject}"')
    sent = []
    for mid in found[0].split():
        _, data = imap.fetch(mid, "(BODY.PEEK[HEADER.FIELDS (BCC DATE)])")
        m = email.message_from_bytes(data[0][1], policy=policy.default)
        bcc = set(a.lower() for a in ADDR.findall(m.get("Bcc", "")))
        sent += [n for n, g in groups.items() if g == bcc]
    imap.select('"[Gmail]/All Mail"', readonly=True)
    _, bounces = imap.search(None, '(OR FROM "mailer-daemon" FROM "postmaster")', "SINCE", time.strftime("%d-%b-%Y"))
    imap.logout()
    print(f"sent batches: {sorted(sent)} of {sorted(groups)}; bounce notices today: {len(bounces[0].split())}")
    for n in sorted(sent):
        print(f"  node scripts/manual-send-kit.mjs {slug} --record {n}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug")
    ap.add_argument("--groups", type=int, default=4)
    ap.add_argument("--check-sent", action="store_true")
    a = ap.parse_args()
    check_sent(a.slug) if a.check_sent else make_drafts(a.slug, a.groups)
