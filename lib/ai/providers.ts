export type AiProvider = "openrouter" | "anthropic" | "groq";

export interface ProseRequest {
  provider: AiProvider;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  openrouter: "anthropic/claude-haiku-4-5",
  anthropic: "claude-haiku-4-5",
  groq: "llama-3.3-70b-versatile",
};

export async function streamProse(
  req: ProseRequest
): Promise<ReadableStream<Uint8Array>> {
  switch (req.provider) {
    case "openrouter":
      return streamOpenAiCompatible(
        "https://openrouter.ai/api/v1/chat/completions",
        req,
        {
          "HTTP-Referer": "https://github.com/",
          "X-Title": "DESIGN.md Extractor",
        }
      );
    case "groq":
      return streamOpenAiCompatible(
        "https://api.groq.com/openai/v1/chat/completions",
        req
      );
    case "anthropic":
      return streamAnthropic(req);
  }
}

async function streamOpenAiCompatible(
  url: string,
  req: ProseRequest,
  extraHeaders: Record<string, string> = {}
): Promise<ReadableStream<Uint8Array>> {
  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${req.apiKey}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({
      model: req.model,
      stream: true,
      messages: [
        { role: "system", content: req.systemPrompt },
        { role: "user", content: req.userPrompt },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    throw new Error(
      `Upstream provider error (${upstream.status}): ${text.slice(0, 200)}`
    );
  }

  return parseSseToText(upstream.body, parseOpenAiChunk);
}

async function streamAnthropic(
  req: ProseRequest
): Promise<ReadableStream<Uint8Array>> {
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": req.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: 1024,
      stream: true,
      system: req.systemPrompt,
      messages: [{ role: "user", content: req.userPrompt }],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    throw new Error(
      `Upstream provider error (${upstream.status}): ${text.slice(0, 200)}`
    );
  }

  return parseSseToText(upstream.body, parseAnthropicChunk);
}

function parseSseToText(
  source: ReadableStream<Uint8Array>,
  parseChunk: (line: string) => string | null
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = source.getReader();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") {
            controller.close();
            return;
          }
          const text = parseChunk(payload);
          if (text) controller.enqueue(encoder.encode(text));
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}

function parseOpenAiChunk(payload: string): string | null {
  try {
    const json = JSON.parse(payload);
    return json.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

function parseAnthropicChunk(payload: string): string | null {
  try {
    const json = JSON.parse(payload);
    if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
      return json.delta.text ?? null;
    }
    return null;
  } catch {
    return null;
  }
}
