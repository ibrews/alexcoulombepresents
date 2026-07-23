import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { setTestimonialApproved, deleteTestimonial } from "@/lib/db";

// Constant-time key check (hash both sides so lengths always match).
function adminKeyValid(provided: string | null): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !provided) return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// Approve or delete a pending testimonial — the one-liner from the
// "pending approval" email.
//   POST /api/admin/testimonials?id=1&key=ADMIN_KEY                 → approve
//   POST /api/admin/testimonials?id=1&key=ADMIN_KEY&action=delete   → delete
export async function POST(req: NextRequest) {
  if (!adminKeyValid(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const idParam = req.nextUrl.searchParams.get("id");
  const id = idParam ? Number(idParam) : NaN;
  if (!idParam || Number.isNaN(id)) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const action = req.nextUrl.searchParams.get("action");

  try {
    if (action === "delete") {
      const deleted = await deleteTestimonial(id);
      return NextResponse.json({ ok: true, deleted });
    }

    const updated = await setTestimonialApproved(id, true);
    return NextResponse.json({ ok: true, approved: updated });
  } catch (err) {
    console.error("Admin testimonials error:", err);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}
