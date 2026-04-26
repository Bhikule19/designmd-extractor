import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultView } from "@/components/result-view";
import { Button } from "@/components/ui/button";
import { findDiscoverEntry } from "@/lib/discover";
import { extract } from "@/lib/extract";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = findDiscoverEntry(slug);
  if (!entry) return { title: "Not found" };
  return {
    title: `${entry.name} · DESIGN.md Extractor`,
    description: `Design system extracted from ${entry.url}`,
  };
}

export default async function DiscoverDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = findDiscoverEntry(slug);
  if (!entry) notFound();

  const result = await extract(entry.url);

  if (!result.ok) {
    return (
      <section className="w-full max-w-3xl mx-auto px-6 py-16 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Extraction failed for {entry.name}
        </h1>
        <p className="text-sm text-muted-fg">{result.error.message}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/discover">← Back to Discover</Link>
        </Button>
      </section>
    );
  }

  return (
    <>
      <div className="border-b">
        <div className="w-full max-w-6xl mx-auto px-6 py-3 flex items-center justify-between text-xs">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/discover">← All examples</Link>
          </Button>
          <span className="text-muted-fg font-mono">
            cached · revalidates daily
          </span>
        </div>
      </div>
      <ResultView tokens={result.tokens} />
    </>
  );
}
