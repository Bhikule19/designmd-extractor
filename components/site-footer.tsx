export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="row" style={{ gap: 10 }}>
          <span className="logo-dot" aria-hidden />
          <span>
            design.md<span className="faint">/</span>extractor{" "}
            <span className="faint">·</span> v0.4.0
          </span>
        </div>
        <div className="footer-meta">
          <span>
            built by{" "}
            <a
              href="https://github.com/Bhikule19"
              target="_blank"
              rel="noreferrer noopener"
            >
              @Bhikule19
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
