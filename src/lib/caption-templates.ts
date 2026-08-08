/** Caption templates for different social media platforms. */

export type Platform = "instagram" | "tiktok" | "telegram" | "whatsapp";
export type Tone = "casual" | "persuasive" | "educational" | "urgent";

interface CaptionInput {
  productName: string;
  price: string;
  commissionRate: string;
  shortLink: string;
  rating: string;
  shopName: string;
}

const TONE_EMOJI: Record<Tone, string> = {
  casual: "✨",
  persuasive: "🔥",
  educational: "💡",
  urgent: "⏰",
};

const TONE_CTA: Record<Tone, string> = {
  casual: "Cek sekarang:",
  persuasive: "Jangan sampai kehabisan!",
  educational: "Baca review lengkapnya & grab di sini:",
  urgent: "Stok terbatas, buruan checkout:",
};

const HASHTAGS: Record<Platform, string> = {
  instagram: "\n\n#shopee #affiliate #rekomendasi #racunshopee #shopeefinds",
  tiktok: "\n\n#shopee #fyp #racunshopee #shopeefinds",
  telegram: "",
  whatsapp: "",
};

function buildInstagram(input: CaptionInput, tone: Tone): string {
  const emoji = TONE_EMOJI[tone];
  const cta = TONE_CTA[tone];
  return [
    `${emoji} ${input.productName}`,
    `💰 Harga: ${input.price}`,
    `⭐ Rating: ${input.rating} | 🏪 ${input.shopName}`,
    "",
    `${cta} ${input.shortLink}`,
    HASHTAGS.instagram,
  ].join("\n");
}

function buildTiktok(input: CaptionInput, tone: Tone): string {
  const cta = TONE_CTA[tone];
  return [
    `POV: kamu nemu ${input.productName} dengan harga ${input.price} ${TONE_EMOJI[tone]}`,
    "",
    `${cta} ${input.shortLink}`,
    HASHTAGS.tiktok,
  ].join("\n");
}

function buildTelegram(input: CaptionInput, tone: Tone): string {
  const cta = TONE_CTA[tone];
  return [
    `${TONE_EMOJI[tone]} HOT DEAL`,
    "",
    input.productName,
    `💰 ${input.price}`,
    `⭐ Rating: ${input.rating}`,
    `🏪 ${input.shopName}`,
    `Komisi: ${input.commissionRate}`,
    "",
    `👉 ${cta} ${input.shortLink}`,
  ].join("\n");
}

function buildWhatsapp(input: CaptionInput, tone: Tone): string {
  const cta = TONE_CTA[tone];
  return [
    `${input.productName} — ${input.price}`,
    `⭐ ${input.rating} | 🏪 ${input.shopName}`,
    "",
    `${cta} ${input.shortLink}`,
  ].join("\n");
}

const BUILDERS: Record<Platform, (input: CaptionInput, tone: Tone) => string> =
  {
    instagram: buildInstagram,
    tiktok: buildTiktok,
    telegram: buildTelegram,
    whatsapp: buildWhatsapp,
  };

export function generateCaption(
  platform: Platform,
  tone: Tone,
  input: CaptionInput
): string {
  const builder = BUILDERS[platform];
  return builder(input, tone);
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
};

export const TONE_LABELS: Record<Tone, string> = {
  casual: "Casual",
  persuasive: "Persuasive",
  educational: "Educational",
  urgent: "Urgent",
};
