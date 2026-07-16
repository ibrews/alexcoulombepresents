import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSignups, getListCounts, deleteSignup } from "@/lib/db";
import { LISTS } from "@/lib/lists";

// Constant-time key check (hash both sides so lengths always match).
function adminKeyValid(provided: string | null): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !provided) return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// Protected export of signups.
//   /api/admin/signups?key=ADMIN_KEY                  → JSON: per-list counts
//   /api/admin/signups?key=ADMIN_KEY&list=forage      → JSON rows for one list
//   /api/admin/signups?key=ADMIN_KEY&list=forage&format=csv → CSV download
export async function GET(req: NextRequest) {
  if (!adminKeyValid(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const list = req.nextUrl.searchParams.get("list") ?? undefined;
  const format = req.nextUrl.searchParams.get("format");

  try {
    if (!list) {
      const counts = await getListCounts();
      return NextResponse.json({ lists: LISTS, counts });
    }

    const rows = await getSignups(list);

    if (format === "csv") {
      const esc = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
      const header = "email,name,message,list,created_at";
      const body = rows
        .map((r) => [r.email, r.name, r.message, r.list, r.created_at].map(esc).join(","))
        .join("\n");
      return new NextResponse(`${header}\n${body}\n`, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${list}-signups.csv"`,
        },
      });
    }

    return NextResponse.json({ list, count: rows.length, rows });
  } catch (err) {
    console.error("Admin signups error:", err);
    return NextResponse.json({ error: "Query failed." }, { status: 500 });
  }
}

// Remove a signup (cleanup / unsubscribe).
//   DELETE /api/admin/signups?key=ADMIN_KEY&email=foo@bar.com[&list=forage]
export async function DELETE(req: NextRequest) {
  if (!adminKeyValid(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const email = req.nextUrl.searchParams.get("email");
  const list = req.nextUrl.searchParams.get("list") ?? undefined;
  if (!email) {
    return NextResponse.json({ error: "email is required." }, { status: 400 });
  }
  try {
    const deleted = await deleteSignup(email, list);
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error("Admin delete error:", err);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
