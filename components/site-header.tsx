"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GitHubLogo } from "@/components/icons";
import { useExtractStore } from "@/lib/store";

export function SiteHeader() {
  const reset = useExtractStore((s) => s.reset);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-bg/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          onClick={() => reset()}
          className="flex items-center gap-2 font-mono text-sm tracking-tight"
        >
          <span aria-hidden className="inline-block size-2 rounded-full bg-fg" />
          <span className="font-semibold">design.md</span>
          <span className="text-muted-fg hidden sm:inline">extractor</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/discover">Discover</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/whats-new">What&apos;s new</Link>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="GitHub">
            <a
              href="https://github.com/Bhikule19/designmd-extractor"
              target="_blank"
              rel="noreferrer noopener"
            >
              <GitHubLogo className="size-4" />
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
