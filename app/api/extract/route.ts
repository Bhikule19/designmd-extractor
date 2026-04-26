import { NextResponse } from "next/server";
import { z } from "zod";
import { extract } from "@/lib/extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  url: z.string().min(3).max(2048),
});

export async function POST(request: Request) {
  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_URL", message: "URL is required" } },
      { status: 400 }
    );
  }

  const result = await extract(body.url);

  if (!result.ok) {
    return NextResponse.json(result, { status: 422 });
  }

  return NextResponse.json(result);
}
