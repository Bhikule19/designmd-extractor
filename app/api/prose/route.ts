import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AI prose generation is disabled in v0.1.x. The extractor's deterministic
 * path is the only path the public surface exposes today. We will turn this
 * route back on once the productionised BYOK flow ships — the original
 * implementation is preserved below for easy reinstatement.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "AI_PROSE_DISABLED",
        message:
          "The optional AI prose layer is temporarily disabled. Extraction itself remains fully deterministic.",
      },
    },
    { status: 501 }
  );
}

/* ──────────────────────────────────────────────────────────
   Original implementation — re-enable when AI prose returns.

import { z } from "zod";
import {
  buildSectionPrompt,
  buildSystemPrompt,
  type ProseSection,
} from "@/lib/ai/prompts";
import { streamProse, type AiProvider } from "@/lib/ai/providers";

const sectionEnum = z.enum(["overview", "components", "guidelines"]);
const providerEnum = z.enum(["openrouter", "anthropic", "groq"]);

const bodySchema = z.object({
  section: sectionEnum,
  provider: providerEnum,
  apiKey: z.string().min(8).max(512),
  model: z.string().min(1).max(128),
  tokens: z.unknown(),
});

export async function POST(request: Request) {
  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: err instanceof Error ? err.message : "Invalid request",
        },
      },
      { status: 400 }
    );
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildSectionPrompt(
    body.section as ProseSection,
    body.tokens as Parameters<typeof buildSectionPrompt>[1]
  );

  try {
    const stream = await streamProse({
      provider: body.provider as AiProvider,
      apiKey: body.apiKey,
      model: body.model,
      systemPrompt,
      userPrompt,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "UPSTREAM_FAILED",
          message:
            err instanceof Error ? err.message : "Provider request failed",
        },
      },
      { status: 502 }
    );
  }
}
   ────────────────────────────────────────────────────────── */
