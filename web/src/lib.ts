import { Listing, SourceStatusMap, StatsData } from "./types";

export interface SourceConfig {
  id: string;
  name: string;
  type: string;
  url: string;
  enabled: boolean;
  frequencyMinutes: number;
  tags?: string[];
}

async function loadJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(response.statusText);
    return (await response.json()) as T;
  } catch (error) {
    console.error(`Failed to load ${path}`, error);
    return fallback;
  }
}

export function getDataBase(pathname: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}${pathname}`;
}

export async function fetchListings(): Promise<Listing[]> {
  return loadJson(getDataBase("/data/listings.json"), []);
}

export async function fetchStatuses(): Promise<SourceStatusMap> {
  return loadJson(getDataBase("/data/sources_status.json"), {});
}

export async function fetchStats(): Promise<StatsData> {
  return loadJson(getDataBase("/data/stats.json"), { perCity: {}, updatedAt: null });
}

export async function fetchSources(): Promise<SourceConfig[]> {
  return loadJson(getDataBase("/config/sources.json"), []);
}
