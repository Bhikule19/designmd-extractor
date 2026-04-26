export interface DiscoverEntry {
  slug: string;
  name: string;
  url: string;
  tagline: string;
}

export const DISCOVER_ENTRIES: DiscoverEntry[] = [
  {
    slug: "stripe",
    name: "Stripe",
    url: "https://stripe.com",
    tagline: "Payment infrastructure for the internet",
  },
  {
    slug: "linear",
    name: "Linear",
    url: "https://linear.app",
    tagline: "Streamline issues, projects, and roadmaps",
  },
  {
    slug: "vercel",
    name: "Vercel",
    url: "https://vercel.com",
    tagline: "Build and deploy the best web experiences",
  },
  {
    slug: "supabase",
    name: "Supabase",
    url: "https://supabase.com",
    tagline: "The open source Firebase alternative",
  },
  {
    slug: "tailwindcss",
    name: "Tailwind CSS",
    url: "https://tailwindcss.com",
    tagline: "Rapidly build modern websites without leaving HTML",
  },
  {
    slug: "resend",
    name: "Resend",
    url: "https://resend.com",
    tagline: "Email for developers",
  },
  {
    slug: "raycast",
    name: "Raycast",
    url: "https://www.raycast.com",
    tagline: "A blazingly fast, totally extendable launcher",
  },
  {
    slug: "github",
    name: "GitHub",
    url: "https://github.com",
    tagline: "Where the world builds software",
  },
];

export function findDiscoverEntry(slug: string): DiscoverEntry | undefined {
  return DISCOVER_ENTRIES.find((e) => e.slug === slug);
}
