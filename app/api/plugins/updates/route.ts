import { NextResponse } from "next/server";
import { PLUGIN_UPDATES_MANIFEST } from "@/lib/commerce/pluginUpdates";

// Public, anonymous version-check endpoint for UE plugins (URMBridge,
// SceneAudit, Forage, BPAutoLayout, URKPreviewer). No auth — matches the
// site's existing public-GET pattern (see /api/vote, /api/training-survey).
//
// No customer data, no license info, no direct binary URLs — ever, in this
// response. This rarely changes, so a short cache is fine (unlike the poll
// endpoints above, which use no-store because they're read live mid-class).
export async function GET() {
  return NextResponse.json(PLUGIN_UPDATES_MANIFEST, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
