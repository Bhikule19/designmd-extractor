import { getKv } from "@/lib/kv";

const KEY = {
  extractTotal: "kpi:extract:total",
  extractHosts: "kpi:extract:hosts",
  compareTotal: "kpi:compare:total",
  comparePresets: "kpi:compare:presets",
  discoverTotal: "kpi:discover:total",
  discoverSlugs: "kpi:discover:slugs",
  downloadTotal: "kpi:download:total",
} as const;

const HOST_MAX_LENGTH = 80;
const PRESET_MAX_LENGTH = 64;
const SLUG_MAX_LENGTH = 32;

/* ─── Server-side trackers ─── */

export async function trackExtract(host: string): Promise<void> {
  const safeHost = sanitiseHost(host);
  const kv = getKv();
  await Promise.all([
    kv.incr(KEY.extractTotal),
    safeHost ? kv.zincrby(KEY.extractHosts, 1, safeHost) : Promise.resolve(0),
  ]);
}

export async function trackCompare(): Promise<void> {
  const kv = getKv();
  await kv.incr(KEY.compareTotal);
}

export async function trackComparePreset(presetId: string): Promise<void> {
  const safe = presetId.slice(0, PRESET_MAX_LENGTH);
  if (!safe) return;
  const kv = getKv();
  await kv.zincrby(KEY.comparePresets, 1, safe);
}

export async function trackDiscover(slug?: string): Promise<void> {
  const kv = getKv();
  await kv.incr(KEY.discoverTotal);
  if (slug) {
    const safe = slug.slice(0, SLUG_MAX_LENGTH);
    if (safe) await kv.zincrby(KEY.discoverSlugs, 1, safe);
  }
}

export async function trackDownload(): Promise<void> {
  const kv = getKv();
  await kv.incr(KEY.downloadTotal);
}

/* ─── Reader ─── */

export interface StatsSnapshot {
  extract: {
    total: number;
    topHosts: Array<{ member: string; score: number }>;
  };
  compare: {
    total: number;
    topPresets: Array<{ member: string; score: number }>;
  };
  discover: {
    total: number;
    topSlugs: Array<{ member: string; score: number }>;
  };
  download: { total: number };
  generatedAt: string;
}

export async function readStats(): Promise<StatsSnapshot> {
  const kv = getKv();
  const [
    extractTotal,
    extractHosts,
    compareTotal,
    comparePresets,
    discoverTotal,
    discoverSlugs,
    downloadTotal,
  ] = await Promise.all([
    kv.get(KEY.extractTotal),
    kv.ztop(KEY.extractHosts, 10),
    kv.get(KEY.compareTotal),
    kv.ztop(KEY.comparePresets, 10),
    kv.get(KEY.discoverTotal),
    kv.ztop(KEY.discoverSlugs, 10),
    kv.get(KEY.downloadTotal),
  ]);

  return {
    extract: { total: extractTotal ?? 0, topHosts: extractHosts },
    compare: { total: compareTotal ?? 0, topPresets: comparePresets },
    discover: { total: discoverTotal ?? 0, topSlugs: discoverSlugs },
    download: { total: downloadTotal ?? 0 },
    generatedAt: new Date().toISOString(),
  };
}

/* ─── Helpers ─── */

function sanitiseHost(raw: string): string {
  try {
    const u = raw.startsWith("http") ? new URL(raw) : new URL(`https://${raw}`);
    return u.hostname.replace(/^www\./, "").toLowerCase().slice(0, HOST_MAX_LENGTH);
  } catch {
    return raw.replace(/[^a-zA-Z0-9.\-]/g, "").toLowerCase().slice(0, HOST_MAX_LENGTH);
  }
}
