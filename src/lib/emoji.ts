// "Sticker" messages are ones made up solely of emoji (no letters/numbers), so
// chat can render them large and bubble-less, Telegram-style.

// Anything that is NOT an emoji pictograph, skin-tone modifier, ZWJ (‍),
// variation selector (️), or whitespace. (We deliberately exclude
// \p{Emoji_Component}, which would also match plain digits like "2024".)
const NON_STICKER =
  /[^\p{Extended_Pictographic}\p{Emoji_Modifier}‍️\s]/u;

const PICTOGRAPH = /\p{Extended_Pictographic}/gu;

/** A curated set of emoji shown in the chat sticker picker. */
export const STICKERS = [
  "😂", "❤️", "👍", "🔥", "🎉", "🥳", "😎",
  "😍", "😭", "🙏", "👏", "💯", "🤣", "😅",
  "😊", "🙂", "😘", "🤔", "😢", "😡", "👌",
  "✌️", "🤝", "💪", "🙌", "🎊", "✨", "⭐",
  "💖", "😴", "🥰", "😇", "🤩", "😋", "😏",
  "🫶", "👀", "🤗", "🤤", "🫡", "👋", "🥹",
] as const;

/**
 * If `content` is emoji-only (1–8 pictographs), returns the count so the bubble
 * can size the "sticker" accordingly; otherwise null (render as normal text).
 */
export function emojiOnlyCount(content: string): number | null {
  const t = content.trim();
  if (!t || NON_STICKER.test(t)) return null;
  const count = (t.match(PICTOGRAPH) ?? []).length;
  return count >= 1 && count <= 8 ? count : null;
}
