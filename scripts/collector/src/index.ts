import path from "path";
import { fileURLToPath } from "url";
import { fetchSource } from "./fetchers.js";
import { buildStats, flagAnomaly } from "./anomalies.js";
import { scoreListing, passesKeywordFilter } from "./scoring.js";
import {
  Listing,
  FiltersConfig,
  SourceConfig,
  SourceStatusMap
} from "./types.js";
import { dedupeListings } from "./dedup.js";
import { dispatchAlerts } from "./alerts.js";
import { readJsonFile, writeJsonFile, withinCooldown } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

const sourcesPath = path.join(rootDir, "config", "sources.json");
const filtersPath = path.join(rootDir, "config", "filters.json");
const listingsPath = path.join(rootDir, "data", "listings.json");
const statusPath = path.join(rootDir, "data", "sources_status.json");
const statsPath = path.join(rootDir, "data", "stats.json");

async function loadConfigs(): Promise<{
  sources: SourceConfig[];
  filters: FiltersConfig;
}> {
  const sources = await readJsonFile<SourceConfig[]>(sourcesPath, []);
  const filters = await readJsonFile<FiltersConfig>(filtersPath, {
    minScore: 50,
    keywords: [],
    penalties: [],
    anomaly: { lowMultiplier: 1.5, highMultiplier: 1.5 }
  });
  return { sources, filters };
}

async function loadExistingListings(): Promise<Listing[]> {
  return readJsonFile<Listing[]>(listingsPath, []);
}

async function persistListings(listings: Listing[]): Promise<void> {
  const sorted = [...listings].sort((a, b) => {
    const dateA = a.publishedAt || a.createdAt;
    const dateB = b.publishedAt || b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
  await writeJsonFile(listingsPath, sorted);
}

async function persistStats(stats: any): Promise<void> {
  await writeJsonFile(statsPath, stats);
}

async function persistStatus(status: SourceStatusMap): Promise<void> {
  await writeJsonFile(statusPath, status);
}

async function main(): Promise<void> {
  const { sources, filters } = await loadConfigs();
  const existingListings = await loadExistingListings();
  const status = await readJsonFile<SourceStatusMap>(statusPath, {});

  const newListings: Listing[] = [];
  for (const source of sources) {
    if (!source.enabled) continue;

    const entry = status[source.id];
    if (entry?.blocked) {
      console.log(`Source ${source.name} blocked, skipping`);
      continue;
    }

    if (withinCooldown(entry?.lastRun, source.frequencyMinutes)) {
      console.log(`Source ${source.name} within cooldown, skipping`);
      continue;
    }

    try {
      const { listings, statusCode } = await fetchSource(source);

      if (statusCode === 403 || statusCode === 429) {
        status[source.id] = {
          lastRun: new Date().toISOString(),
          lastError: `Blocked with status ${statusCode}`,
          blocked: true
        };
        continue;
      }

      const enriched = listings
        .map((l) => scoreListing(l, filters))
        .filter((l) => passesKeywordFilter(l, filters));
      newListings.push(...enriched);

      status[source.id] = {
        lastRun: new Date().toISOString(),
        lastError: null,
        blocked: false
      };
    } catch (error: any) {
      status[source.id] = {
        lastRun: new Date().toISOString(),
        lastError: error?.message || "Unknown error",
        blocked: false
      };
    }
  }

  const existingFingerprints = new Set(existingListings.map((l) => l.fingerprint));
  const trulyNew = newListings.filter((l) => !existingFingerprints.has(l.fingerprint));

  const merged = dedupeListings([...existingListings, ...newListings]).map((listing) => {
    if (!listing.pricePerSqm && listing.price && listing.surface) {
      listing.pricePerSqm = Math.round((listing.price / listing.surface) * 100) / 100;
    }
    return listing;
  });
  const stats = buildStats(merged);
  const withAnomalies = merged.map((listing) =>
    flagAnomaly(listing, stats, filters.anomaly.lowMultiplier, filters.anomaly.highMultiplier)
  );

  await persistListings(withAnomalies);
  await persistStats(stats);
  await persistStatus(status);

  await dispatchAlerts(trulyNew, filters.minScore);
  console.log(
    `Collector finished: ${trulyNew.length} nouvelles annonces, ${withAnomalies.length} au total.`
  );
}

main().catch((error) => {
  console.error("Collector failed", error);
  process.exit(1);
});
