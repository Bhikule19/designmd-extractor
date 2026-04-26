import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DISCOVER_ENTRIES } from "@/lib/discover";

export const metadata = {
  title: "Discover · DESIGN.md Extractor",
  description: "Explore design systems extracted from popular websites.",
};

export default function DiscoverPage() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-12 space-y-8">
      <header className="space-y-3 max-w-2xl">
        <p className="text-xs uppercase tracking-wider text-muted-fg font-mono">
          Discover
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Try the extractor on these sites
        </h1>
        <p className="text-sm text-muted-fg">
          Each card runs a fresh deterministic extraction against the live site.
          Results are cached at the edge for a day.
        </p>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DISCOVER_ENTRIES.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={`/discover/${entry.slug}`}
              className="block rounded-lg border bg-card p-5 transition-colors hover:bg-muted/40 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="font-semibold tracking-tight">{entry.name}</h2>
                  <p className="text-xs text-muted-fg">{entry.tagline}</p>
                </div>
                <ArrowRight className="size-4 text-muted-fg group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="mt-3 text-xs font-mono text-muted-fg truncate">
                {entry.url.replace(/^https?:\/\//, "")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
