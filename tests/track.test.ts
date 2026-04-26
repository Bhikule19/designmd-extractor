import { describe, it, expect, beforeEach } from "vitest";
import {
  readStats,
  trackCompare,
  trackComparePreset,
  trackDiscover,
  trackDownload,
  trackExtract,
} from "@/lib/track";
import { _resetKvForTests } from "@/lib/kv";

beforeEach(() => {
  _resetKvForTests();
});

describe("KPI counters", () => {
  it("increments the extract total and credits the host", async () => {
    await trackExtract("stripe.com");
    await trackExtract("stripe.com");
    await trackExtract("https://Linear.app");
    const stats = await readStats();
    expect(stats.extract.total).toBe(3);
    const stripe = stats.extract.topHosts.find((h) => h.member === "stripe.com");
    const linear = stats.extract.topHosts.find((h) => h.member === "linear.app");
    expect(stripe?.score).toBe(2);
    expect(linear?.score).toBe(1);
  });

  it("increments compare totals independently of presets", async () => {
    await trackCompare();
    await trackCompare();
    await trackComparePreset("stripe.com vs linear.app");
    const stats = await readStats();
    expect(stats.compare.total).toBe(2);
    expect(stats.compare.topPresets[0]?.member).toBe(
      "stripe.com vs linear.app"
    );
    expect(stats.compare.topPresets[0]?.score).toBe(1);
  });

  it("increments discover total on every visit and credits the slug when supplied", async () => {
    await trackDiscover();
    await trackDiscover("stripe");
    await trackDiscover("stripe");
    await trackDiscover("linear");
    const stats = await readStats();
    expect(stats.discover.total).toBe(4);
    expect(stats.discover.topSlugs[0]?.member).toBe("stripe");
    expect(stats.discover.topSlugs[0]?.score).toBe(2);
    expect(stats.discover.topSlugs[1]?.member).toBe("linear");
  });

  it("counts downloads", async () => {
    await trackDownload();
    await trackDownload();
    await trackDownload();
    const stats = await readStats();
    expect(stats.download.total).toBe(3);
  });

  it("returns zeroed snapshot when nothing has been tracked", async () => {
    const stats = await readStats();
    expect(stats.extract.total).toBe(0);
    expect(stats.compare.total).toBe(0);
    expect(stats.discover.total).toBe(0);
    expect(stats.download.total).toBe(0);
    expect(stats.extract.topHosts).toEqual([]);
    expect(stats.compare.topPresets).toEqual([]);
    expect(stats.discover.topSlugs).toEqual([]);
  });
});
