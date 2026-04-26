import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="row" style={{ gap: 10 }}>
          <span className="logo-dot" aria-hidden />
          <span>
            design.md<span className="faint">/</span>extractor{" "}
            <span className="faint">·</span> v0.0.1
          </span>
        </div>
        <div className="footer-meta">
          <span>deterministic</span>
          <span className="faint">·</span>
          <span>BYOK ai optional</span>
          <span className="faint">·</span>
          <span>MIT</span>
          <span className="faint">·</span>
          <Link href="/discover">discover</Link>
          <Link href="/whats-new">changelog</Link>
          <a
            href="https://github.com/Bhikule19/designmd-extractor"
            target="_blank"
            rel="noreferrer noopener"
          >
            github
          </a>
        </div>
      </div>
    </footer>
  );
}
