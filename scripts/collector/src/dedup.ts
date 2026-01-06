import { Listing } from "./types.js";

export function dedupeListings(listings: Listing[]): Listing[] {
  const map = new Map<string, Listing>();
  for (const listing of listings) {
    if (!map.has(listing.fingerprint)) {
      map.set(listing.fingerprint, listing);
    }
  }
  return Array.from(map.values());
}
