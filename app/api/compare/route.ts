import { NextResponse } from "next/server";
import { z } from "zod";
import { extract } from "@/lib/extract";
import { compareTokens } from "@/lib/compare";
import { trackCompare } from "@/lib/track";
import type { ExtractionResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  urlA: z.string().min(3).max(2048),
  urlB: z.string().min(3).max(2048),
});

export async function POST(request: Request) {
  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_INPUT", message: "Two URLs required" },
      },
      { status: 400 }
    );
  }

  // Run both extractions in parallel — they're independent.
  const [a, b] = await Promise.all([extract(body.urlA), extract(body.urlB)]);

  if (!a.ok) return failed(a, "a", body.urlA);
  if (!b.ok) return failed(b, "b", body.urlB);

  const comparison = compareTokens(a.tokens, b.tokens);

  // Fire-and-forget — preset attribution arrives separately via /api/track.
  void trackCompare().catch(() => {});

  return NextResponse.json({
    ok: true,
    a: a.tokens,
    b: b.tokens,
    comparison,
  });
}

function failed(
  result: Extract<ExtractionResult, { ok: false }>,
  side: "a" | "b",
  url: string
) {
  return NextResponse.json(
    {
      ok: false,
      side,
      url,
      error: result.error,
    },
    { status: 422 }
  );
}
