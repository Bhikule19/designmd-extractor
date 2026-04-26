export interface DiscoverEntry {
  slug: string;
  name: string;
  url: string;
  hostname: string;
  tagline: string;
  hintAccent: string;
  hintSecondary: string;
}

export const DISCOVER_ENTRIES: DiscoverEntry[] = [
  {
    slug: "stripe",
    name: "Stripe",
    url: "https://stripe.com",
    hostname: "stripe.com",
    tagline: "Payments for the internet.",
    hintAccent: "#635BFF",
    hintSecondary: "#0A2540",
  },
  {
    slug: "linear",
    name: "Linear",
    url: "https://linear.app",
    hostname: "linear.app",
    tagline: "The issue tracker you'll enjoy.",
    hintAccent: "#5E6AD2",
    hintSecondary: "#1F2023",
  },
  {
    slug: "vercel",
    name: "Vercel",
    url: "https://vercel.com",
    hostname: "vercel.com",
    tagline: "Develop. Preview. Ship.",
    hintAccent: "#000000",
    hintSecondary: "#FAFAFA",
  },
  {
    slug: "supabase",
    name: "Supabase",
    url: "https://supabase.com",
    hostname: "supabase.com",
    tagline: "The open source Firebase alternative.",
    hintAccent: "#3ECF8E",
    hintSecondary: "#1F1F1F",
  },
  {
    slug: "tailwindcss",
    name: "Tailwind CSS",
    url: "https://tailwindcss.com",
    hostname: "tailwindcss.com",
    tagline: "Utility-first CSS.",
    hintAccent: "#06B6D4",
    hintSecondary: "#0F172A",
  },
  {
    slug: "resend",
    name: "Resend",
    url: "https://resend.com",
    hostname: "resend.com",
    tagline: "Email for developers.",
    hintAccent: "#000000",
    hintSecondary: "#F5F5F5",
  },
  {
    slug: "raycast",
    name: "Raycast",
    url: "https://www.raycast.com",
    hostname: "raycast.com",
    tagline: "Productivity tool for your Mac.",
    hintAccent: "#FF6363",
    hintSecondary: "#1A1A1A",
  },
  {
    slug: "github",
    name: "GitHub",
    url: "https://github.com",
    hostname: "github.com",
    tagline: "Where the world builds software.",
    hintAccent: "#0969DA",
    hintSecondary: "#0D1117",
  },
];

export function findDiscoverEntry(slug: string): DiscoverEntry | undefined {
  return DISCOVER_ENTRIES.find((e) => e.slug === slug);
}
