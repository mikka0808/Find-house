import { Listing, StatsData } from "./types.js";

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / (values.length || 1);
}

function std(values: number[], avg: number): number {
  const variance =
    values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / (values.length || 1);
  return Math.sqrt(variance);
}

export function buildStats(listings: Listing[], windowDays = 30): StatsData {
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const perCity: Record<string, { values: number[] }> = {};

  for (const listing of listings) {
    if (!listing.pricePerSqm) continue;
    if (!listing.city && !listing.postalCode) continue;

    const published = listing.publishedAt ? new Date(listing.publishedAt).getTime() : now;
    if (now - published > windowMs) continue;

    const key = listing.postalCode || listing.city!;
    perCity[key] ||= { values: [] };
    perCity[key].values.push(listing.pricePerSqm);
  }

  const stats: StatsData = { perCity: {}, updatedAt: new Date().toISOString() };
  for (const [key, entry] of Object.entries(perCity)) {
    const avg = mean(entry.values);
    stats.perCity[key] = {
      mean: Math.round(avg * 100) / 100,
      std: Math.round(std(entry.values, avg) * 100) / 100
    };
  }
  return stats;
}

export function flagAnomaly(listing: Listing, stats: StatsData, lowMultiplier: number, highMultiplier: number): Listing {
  if (!listing.pricePerSqm) return listing;
  const key = listing.postalCode || listing.city;
  if (!key) return listing;

  const entry = stats.perCity[key];
  if (!entry) return listing;

  const low = entry.mean - entry.std * lowMultiplier;
  const high = entry.mean + entry.std * highMultiplier;

  if (listing.pricePerSqm < low) {
    listing.anomaly = {
      type: "anomaly_low",
      referenceMean: entry.mean,
      referenceStd: entry.std
    };
  } else if (listing.pricePerSqm > high) {
    listing.anomaly = {
      type: "anomaly_high",
      referenceMean: entry.mean,
      referenceStd: entry.std
    };
  }
  return listing;
}
