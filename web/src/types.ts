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
  anomaly?: {
    type: "anomaly_low" | "anomaly_high";
    referenceMean: number;
    referenceStd: number;
  };
  fingerprint: string;
  tags?: string[];
}

export interface SourceStatus {
  lastRun?: string;
  lastError?: string | null;
  blocked?: boolean;
}

export type SourceStatusMap = Record<string, SourceStatus>;

export interface StatsData {
  perCity: Record<string, { mean: number; std: number }>;
  updatedAt: string | null;
}
