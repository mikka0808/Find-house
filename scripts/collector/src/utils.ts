import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
export const rootDir = path.resolve(__dirname, "..", "..");

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.promises.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    return fallback;
  }
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
}

export function buildFingerprint(parts: Array<string | number | undefined>): string {
  const normalized = parts
    .filter(Boolean)
    .map((p) => String(p).toLowerCase().trim())
    .join("|");
  return createHash("sha1").update(normalized).digest("hex");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function withinCooldown(
  lastRun: string | undefined,
  frequencyMinutes: number
): boolean {
  if (!lastRun) return false;
  const elapsed = Date.now() - new Date(lastRun).getTime();
  return elapsed < frequencyMinutes * 60 * 1000;
}
