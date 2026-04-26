"use client";

import { UrlForm } from "@/components/url-form";
import { ResultView } from "@/components/result-view";
import { ExtractError } from "@/components/extract-error";
import { useExtractStore } from "@/lib/store";

export function HomeFlow() {
  const status = useExtractStore((s) => s.status);
  const tokens = useExtractStore((s) => s.tokens);

  if (status === "success" && tokens) {
    return <ResultView tokens={tokens} />;
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          From any URL to a real <span className="font-mono">DESIGN.md</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-fg max-w-xl">
          Paste a URL. Get back a deterministic design system: colour tokens,
          type roles, spacing, radii, components — extracted from the site&apos;s
          actual CSS, not hallucinated by a model.
        </p>
        <UrlForm />
        <ExtractError />
      </div>
    </div>
  );
}
