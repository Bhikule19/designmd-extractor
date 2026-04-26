"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExtractStore } from "@/lib/store";
import { GitHubLogo } from "@/components/icons";

const NAV = [
  { href: "/", label: "extract", match: (p: string) => p === "/" },
  { href: "/discover", label: "discover", match: (p: string) => p.startsWith("/discover") },
  { href: "/whats-new", label: "what's new", match: (p: string) => p === "/whats-new" },
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
          <a
            href="https://github.com/Bhikule19/designmd-extractor"
            target="_blank"
            rel="noreferrer noopener"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <GitHubLogo style={{ width: 13, height: 13 }} />
            github
          </a>
        </nav>
      </div>
    </header>
  );
}
