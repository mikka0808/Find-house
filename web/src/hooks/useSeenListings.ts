import { useEffect, useState } from "react";

const STORAGE_KEY = "find-house-seen";

export function useSeenListings() {
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSeen(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error("Unable to read seen listings", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(seen)));
    } catch (error) {
      console.error("Unable to persist seen listings", error);
    }
  }, [seen]);

  const toggleSeen = (fingerprint: string) => {
    setSeen((prev) => {
      const next = new Set(prev);
      if (next.has(fingerprint)) {
        next.delete(fingerprint);
      } else {
        next.add(fingerprint);
      }
      return next;
    });
  };

  const markSeen = (fingerprint: string) => {
    setSeen((prev) => new Set(prev).add(fingerprint));
  };

  return { seen, toggleSeen, markSeen };
}
