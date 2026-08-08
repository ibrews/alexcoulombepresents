import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getAllCatalogOrders } from "@/lib/commerce/seats";

// Constant-time key check (hash both sides so lengths always match) —
// mirrors app/api/admin/signups/route.ts.
function adminKeyValid(provided: string | null): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !provided) return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// Roster export for capacity-limited (and other) catalog orders, grouped by
// slug — who bought what, in order, so a cohort/voucher roster is one link
// away instead of a Stripe Dashboard export.
//   GET /api/admin/roster?key=ADMIN_KEY
export async function GET(req: NextRequest) {
  if (!adminKeyValid(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const orders = await getAllCatalogOrders();
    const bySlug: Record<
      string,
      Array<{
        email: string | null;
        name: string | null;
        amount_cents: number | null;
        note: string | null;
        created_at: string;
        refunded: boolean;
      }>
    > = {};

    for (const o of orders) {
      const key = o.slug ?? "other";
      if (!bySlug[key]) bySlug[key] = [];
      bySlug[key].push({
        email: o.email,
        name: o.name,
        amount_cents: o.amount_cents,
        note: o.note,
        created_at: o.created_at,
        refunded: o.refunded,
      });
    }

    return NextResponse.json({
      total: orders.length,
      slugs: Object.fromEntries(Object.entries(bySlug).map(([slug, rows]) => [slug, rows.length])),
      orders: bySlug,
    });
  } catch (err) {
    console.error("Admin roster error:", err);
    return NextResponse.json({ error: "Query failed." }, { status: 500 });
  }
}
