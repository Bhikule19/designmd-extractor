import type { Metadata } from "next";
import { JetBrains_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { themeBootstrapScript } from "@/lib/theme";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "design.md/extractor — DESIGN.md from real CSS",
  description:
    "Paste any URL. We parse the real CSS — colours, type, spacing, radius — and emit a verifiable DESIGN.md. No vision model, no invented hex codes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${jetbrainsMono.variable} ${interTight.variable}`}
    >
      <head>
        {/* Apply the saved theme synchronously, before React hydrates. Avoids
            a flash of the wrong palette for users whose preference is light. */}
        <script
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
      </head>
      <body className="app" suppressHydrationWarning>
        <SiteHeader />
        <main className="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
