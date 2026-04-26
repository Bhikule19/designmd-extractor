import { NextResponse } from "next/server";
import { z } from "zod";
import {
  trackComparePreset,
  trackDiscover,
  trackDownload,
} from "@/lib/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Beacon endpoint for client-side KPI events. Strictly typed: only the
 * three event names below are accepted, and each carries minimal payload.
 * No PII, no headers, no fingerprinting. Fire-and-forget from the client.
 */
const bodySchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("compare_preset"),
    preset: z.string().min(1).max(64),
  }),
  z.object({
    event: z.literal("download_md"),
  }),
  z.object({
    event: z.literal("discover"),
    slug: z.string().min(1).max(32).optional(),
  }),
]);

export async function POST(request: Request) {
  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  switch (body.event) {
    case "compare_preset":
      await trackComparePreset(body.preset).catch(() => {});
      break;
    case "download_md":
      await trackDownload().catch(() => {});
      break;
    case "discover":
      await trackDiscover(body.slug).catch(() => {});
      break;
  }

  return NextResponse.json({ ok: true });
}
