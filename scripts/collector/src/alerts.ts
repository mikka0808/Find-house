import { Listing } from "./types.js";

async function postJson(url: string, payload: any): Promise<void> {
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

function formatMessage(listings: Listing[]): string {
  const lines = listings.map(
    (l) => `${l.title} (${l.city || ""}) - ${l.price ? l.price + "€" : "n/a"} -> ${l.url}`
  );
  return `Nouvelles annonces (${listings.length})\n` + lines.join("\n");
}

export async function dispatchAlerts(listings: Listing[], minScore: number): Promise<void> {
  if (listings.length === 0) return;
  const qualified = listings.filter((l) => (l.score ?? 0) >= minScore);
  if (qualified.length === 0) return;

  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (webhookUrl) {
    await postJson(webhookUrl, { listings: qualified });
  }

  if (telegramToken && telegramChatId) {
    const text = encodeURIComponent(formatMessage(qualified));
    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    await postJson(url, { chat_id: telegramChatId, text });
  }
}
