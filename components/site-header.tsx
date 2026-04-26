"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExtractStore } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/", label: "extract", match: (p: string) => p === "/" },
  { href: "/compare", label: "compare", match: (p: string) => p.startsWith("/compare") },
  { href: "/discover", label: "discover", match: (p: string) => p.startsWith("/discover") },
  { href: "/stats", label: "stats", match: (p: string) => p.startsWith("/stats") },
];

export function SiteHeader() {
  const pathname = usePathname();
  const reset = useExtractStore((s) => s.reset);

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" onClick={() => reset()} className="logo">
          <span className="logo-dot" aria-hidden />
          <span className="logo-mark">
            design.md<span className="slash">/</span>extractor
          </span>
        </Link>
        <nav className="nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => item.href === "/" && reset()}
              className={item.match(pathname) ? "is-active" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <span
            aria-hidden
            style={{
              width: 1,
              height: 18,
              background: "var(--border-subtle)",
              margin: "0 4px",
            }}
          />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
