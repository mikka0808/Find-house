import { FiltersConfig, Listing } from "./types.js";
import { clamp } from "./utils.js";

function applyRules(text: string, rules: FiltersConfig["keywords"], baseScore = 0): number {
  let score = baseScore;
  const lowered = text.toLowerCase();
  for (const rule of rules) {
    if (lowered.includes(rule.term.toLowerCase())) {
      score += rule.weight;
    }
  }
  return score;
}

export function scoreListing(listing: Listing, filters: FiltersConfig): Listing {
  const text = `${listing.title} ${listing.description}`;
  let score = applyRules(text, filters.keywords);
  score = applyRules(text, filters.penalties, score);
  listing.score = clamp(score, 0, 100);

  if (listing.price && listing.surface && listing.surface > 0) {
    listing.pricePerSqm = Math.round((listing.price / listing.surface) * 100) / 100;
  }

  return listing;
}

export function passesKeywordFilter(listing: Listing, filters: FiltersConfig): boolean {
  const wanted = filters.filters?.keywords;
  if (!wanted || wanted.length === 0) return true;
  const text = `${listing.title} ${listing.description}`.toLowerCase();
  return wanted.every((word) => text.includes(word.toLowerCase()));
}
