import { describe, expect, it } from "vitest";
import { buildStats, flagAnomaly } from "../src/anomalies.js";
import { Listing } from "../src/types.js";

const listings: Listing[] = [
  {
    id: "1",
    title: "A",
    description: "",
    url: "u1",
    price: 200000,
    surface: 100,
    pricePerSqm: 2000,
    city: "Paris",
    sourceId: "s",
    createdAt: new Date().toISOString(),
    fingerprint: "1"
  },
  {
    id: "2",
    title: "B",
    description: "",
    url: "u2",
    price: 240000,
    surface: 120,
    pricePerSqm: 2000,
    city: "Paris",
    sourceId: "s",
    createdAt: new Date().toISOString(),
    fingerprint: "2"
  }
];

describe("buildStats", () => {
  it("calculates mean and std per city", () => {
    const stats = buildStats(listings);
    expect(stats.perCity["Paris"].mean).toBeCloseTo(2000);
  });
});

describe("flagAnomaly", () => {
  it("marks anomaly when outside expected range", () => {
    const stats = buildStats(listings);
    const candidate: Listing = {
      id: "3",
      title: "C",
      description: "",
      url: "u3",
      price: 80000,
      surface: 100,
      pricePerSqm: 800,
      city: "Paris",
      sourceId: "s",
      createdAt: new Date().toISOString(),
      fingerprint: "3"
    };
    const flagged = flagAnomaly(candidate, stats, 1.5, 1.5);
    expect(flagged.anomaly?.type).toBe("anomaly_low");
  });
});
