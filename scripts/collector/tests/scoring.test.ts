import { describe, expect, it } from "vitest";
import { scoreListing, passesKeywordFilter } from "../src/scoring.js";
import { FiltersConfig, Listing } from "../src/types.js";

const filters: FiltersConfig = {
  minScore: 60,
  keywords: [
    { term: "divisible", weight: 20 },
    { term: "investisseur", weight: 10 }
  ],
  penalties: [{ term: "combles perdus", weight: -20 }],
  anomaly: { lowMultiplier: 1.5, highMultiplier: 1.5 },
  filters: { keywords: ["divisible"] }
};

const baseListing: Listing = {
  id: "1",
  title: "Immeuble divisible pour investisseur",
  description: "",
  url: "https://example.com",
  sourceId: "src",
  createdAt: new Date().toISOString(),
  fingerprint: "abc"
};

describe("scoreListing", () => {
  it("adds weights for positive keywords", () => {
    const scored = scoreListing({ ...baseListing }, filters);
    expect(scored.score).toBeGreaterThanOrEqual(30);
  });

  it("subtracts penalties when present", () => {
    const scored = scoreListing({ ...baseListing, description: "combles perdus" }, filters);
    expect(scored.score).toBeLessThan(30);
  });
});

describe("passesKeywordFilter", () => {
  it("accepts listings containing all filter keywords", () => {
    const result = passesKeywordFilter(baseListing, filters);
    expect(result).toBe(true);
  });

  it("rejects listings missing filter keywords", () => {
    const listing = { ...baseListing, title: "Maison classique" };
    expect(passesKeywordFilter(listing, filters)).toBe(false);
  });
});
