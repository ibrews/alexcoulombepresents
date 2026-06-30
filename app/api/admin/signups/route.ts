import { NextRequest, NextResponse } from "next/server";
import { getSignups, getListCounts } from "@/lib/db";
import { LISTS } from "@/lib/lists";

// Protected export of signups.
//   /api/admin/signups?key=ADMIN_KEY                  → JSON: per-list counts
//   /api/admin/signups?key=ADMIN_KEY&list=forage      → JSON rows for one list
//   /api/admin/signups?key=ADMIN_KEY&list=forage&format=csv → CSV download
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
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
