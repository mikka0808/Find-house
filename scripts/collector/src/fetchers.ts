import { XMLParser } from "fast-xml-parser";
import { buildFingerprint } from "./utils.js";
import { Listing, SourceConfig } from "./types.js";

interface NormalizedRaw {
  id: string;
  title: string;
  description?: string;
  url: string;
  publishedAt?: string;
  price?: number;
  surface?: number;
  city?: string;
  postalCode?: string;
}

async function fetchText(url: string): Promise<{ status: number; body: string }>
{
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116 Safari/537.36",
      accept: "application/rss+xml, application/json, text/html"
    },
    redirect: "follow"
  });
  const body = await response.text();
  return { status: response.status, body };
}

function mapRawListing(raw: NormalizedRaw, source: SourceConfig): Listing {
  const fingerprint = buildFingerprint([
    raw.url,
    raw.title,
    raw.price,
    raw.surface,
    raw.postalCode,
    source.id
  ]);
  return {
    id: raw.id || fingerprint,
    title: raw.title,
    description: raw.description ?? "",
    url: raw.url,
    publishedAt: raw.publishedAt,
    price: raw.price,
    surface: raw.surface,
    city: raw.city,
    postalCode: raw.postalCode,
    sourceId: source.id,
    createdAt: new Date().toISOString(),
    fingerprint,
    tags: source.tags
  };
}

function parseNumber(value?: string | number): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;
  const normalized = value.replace(/[^0-9.,]/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parsePostalCode(raw?: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/\b\d{5}\b/);
  return match ? match[0] : undefined;
}

function parseCityFromTitle(title?: string): string | undefined {
  if (!title) return undefined;
  const parts = title.split("-");
  return parts.length > 1 ? parts[1].trim() : undefined;
}

function parseRss(xml: string): NormalizedRaw[] {
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
  const list = Array.isArray(items) ? items : [items];
  return list
    .filter(Boolean)
    .map((item: any) => {
      const link = item.link?.["@_href"] || item.link || item.guid;
      return {
        id: item.guid || link || item.title,
        title: item.title || "Annonce",
        description: item.description || item["content:encoded"] || "",
        url: typeof link === "string" ? link : link?.["@_href"] || "",
        publishedAt: item.pubDate || item.published,
        price: parseNumber(item.price),
        surface: parseNumber(item.surface || item.area),
        city: item.city || parseCityFromTitle(item.title),
        postalCode: parsePostalCode(item.postalCode)
      } as NormalizedRaw;
    })
    .filter((entry) => entry.url);
}

function parseJsonFeed(json: any): NormalizedRaw[] {
  if (!json) return [];
  const candidates = Array.isArray(json)
    ? json
    : Array.isArray(json.items)
      ? json.items
      : json.listings || [];
  return candidates
    .map((item: any) => ({
      id: item.id || item.url,
      title: item.title || item.name || "Annonce",
      description: item.description || item.summary || "",
      url: item.url || item.link || "",
      publishedAt: item.date || item.publishedAt || item.createdAt,
      price: parseNumber(item.price || item.amount),
      surface: parseNumber(item.surface || item.area || item.size),
      city: item.city || item.location?.city,
      postalCode: parsePostalCode(item.postalCode || item.location?.postalCode)
    }))
    .filter((entry) => entry.url);
}

function parseHtml(html: string, source: SourceConfig): NormalizedRaw[] {
  const linkRegex = /href="(https?:[^"#]+)"[^>]*>([^<]{5,100})<\/a>/gi;
  const results: NormalizedRaw[] = [];
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null) {
    const [, url, text] = match;
    results.push({
      id: buildFingerprint([url, text]),
      title: text.trim(),
      description: `Import best effort depuis ${source.name}`,
      url,
      city: parseCityFromTitle(text)
    });
    if (results.length >= 20) break;
  }
  return results;
}

export async function fetchSource(source: SourceConfig): Promise<{
  listings: Listing[];
  statusCode?: number;
}> {
  const { status, body } = await fetchText(source.url);
  if (status === 403 || status === 429) {
    return { listings: [], statusCode: status };
  }

  let normalized: NormalizedRaw[] = [];
  if (source.type === "rss") {
    normalized = parseRss(body);
  } else if (source.type === "json") {
    try {
      const parsed = JSON.parse(body);
      normalized = parseJsonFeed(parsed);
    } catch (error) {
      normalized = [];
    }
  } else {
    normalized = parseHtml(body, source);
  }

  const listings = normalized.map((raw) => mapRawListing(raw, source));
  return { listings, statusCode: status };
}
