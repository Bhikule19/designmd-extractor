import { Redis } from "@upstash/redis";

/**
 * Tiny KV wrapper. In production (Vercel KV / Upstash Redis) every counter
 * persists across deployments. Locally we fall back to an in-memory map so
 * developers don't need a Redis instance just to render `/stats` — counters
 * just reset on dev-server restart, which is fine for a smoke test.
 *
 * Env vars: prefer Vercel KV's `KV_REST_API_*`, fall back to Upstash's own
 * `UPSTASH_REDIS_REST_*` if a project hooked them up directly.
 */

interface KvLike {
  incr(key: string): Promise<number>;
  get(key: string): Promise<number | null>;
  zincrby(key: string, score: number, member: string): Promise<number>;
  ztop(
    key: string,
    n: number
  ): Promise<Array<{ member: string; score: number }>>;
}

class InMemoryKv implements KvLike {
  private counters = new Map<string, number>();
  private zsets = new Map<string, Map<string, number>>();

  async incr(key: string): Promise<number> {
    const next = (this.counters.get(key) ?? 0) + 1;
    this.counters.set(key, next);
    return next;
  }

  async get(key: string): Promise<number | null> {
    return this.counters.get(key) ?? null;
  }

  async zincrby(key: string, score: number, member: string): Promise<number> {
    const set = this.zsets.get(key) ?? new Map<string, number>();
    const next = (set.get(member) ?? 0) + score;
    set.set(member, next);
    this.zsets.set(key, set);
    return next;
  }

  async ztop(
    key: string,
    n: number
  ): Promise<Array<{ member: string; score: number }>> {
    const set = this.zsets.get(key);
    if (!set) return [];
    return [...set.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([member, score]) => ({ member, score }));
  }
}

class UpstashKv implements KvLike {
  constructor(private redis: Redis) {}

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async get(key: string): Promise<number | null> {
    const raw = await this.redis.get<number | string>(key);
    if (raw === null || raw === undefined) return null;
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  async zincrby(key: string, score: number, member: string): Promise<number> {
    return this.redis.zincrby(key, score, member);
  }

  async ztop(
    key: string,
    n: number
  ): Promise<Array<{ member: string; score: number }>> {
    // zrange with rev + withScores returns [member, score, member, score, ...]
    const raw = (await this.redis.zrange(key, 0, n - 1, {
      rev: true,
      withScores: true,
    })) as Array<string | number>;
    const out: Array<{ member: string; score: number }> = [];
    for (let i = 0; i < raw.length; i += 2) {
      out.push({
        member: String(raw[i]),
        score: Number(raw[i + 1] ?? 0),
      });
    }
    return out;
  }
}

// Cache the KV instance on globalThis so every compiled bundle in the same
// Node process shares one store. Without this, Next.js can produce separate
// module instances for route handlers vs server components, and the
// in-memory dev store would split — increments in /api/extract would never
// show up on /stats.
const GLOBAL_KEY = "__designmd_kv__";

interface GlobalWithKv {
  [GLOBAL_KEY]?: KvLike;
}

export function getKv(): KvLike {
  const g = globalThis as unknown as GlobalWithKv;
  if (g[GLOBAL_KEY]) return g[GLOBAL_KEY];
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  g[GLOBAL_KEY] = url && token ? new UpstashKv(new Redis({ url, token })) : new InMemoryKv();
  return g[GLOBAL_KEY];
}

/** Test helper — wipe the in-memory store between tests. */
export function _resetKvForTests() {
  const g = globalThis as unknown as GlobalWithKv;
  g[GLOBAL_KEY] = new InMemoryKv();
}
