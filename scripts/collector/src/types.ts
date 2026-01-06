export type SourceType = "rss" | "json" | "html";

export interface SourceConfig {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  enabled: boolean;
  frequencyMinutes: number;
  tags?: string[];
}

export interface KeywordRule {
  term: string;
  weight: number;
}

export interface FiltersConfig {
  minScore: number;
  keywords: KeywordRule[];
  penalties: KeywordRule[];
  anomaly: {
    lowMultiplier: number;
    highMultiplier: number;
  };
  filters?: {
    keywords?: string[];
  };
}

export interface SourceStatusEntry {
  lastRun?: string;
  lastError?: string | null;
  blocked?: boolean;
}

export interface SourceStatusMap {
  [sourceId: string]: SourceStatusEntry;
}

export interface ListingAnomaly {
  type: "anomaly_low" | "anomaly_high";
  referenceMean: number;
  referenceStd: number;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  url: string;
  price?: number;
  surface?: number;
  city?: string;
  postalCode?: string;
  sourceId: string;
  publishedAt?: string;
  createdAt: string;
  score?: number;
  pricePerSqm?: number;
  anomaly?: ListingAnomaly;
  fingerprint: string;
  tags?: string[];
}

export interface StatsEntry {
  mean: number;
  std: number;
}

export interface StatsData {
  perCity: Record<string, StatsEntry>;
  updatedAt: string | null;
}
