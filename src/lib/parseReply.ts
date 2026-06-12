import type { AssistantReply } from "./types";

/** Strips markdown fences and trims to the outermost JSON object. */
export function stripToJson(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && (start > 0 || end < text.length - 1)) {
    text = text.slice(start, end + 1);
  }
  return text;
}

/**
 * Parses a (possibly messy) model reply into a complete AssistantReply,
 * backfilling any missing fields so the UI never crashes.
 */
export function parseReply(raw: string): AssistantReply {
  const data = JSON.parse(stripToJson(raw)) as Partial<AssistantReply>;
  return {
    reply: data.reply ?? "",
    reply_translation: data.reply_translation ?? null,
    reply_romanization: data.reply_romanization ?? null,
    corrections: Array.isArray(data.corrections) ? data.corrections : [],
    vocab_suggestions: Array.isArray(data.vocab_suggestions)
      ? data.vocab_suggestions
      : [],
  };
}

/**
 * Best-effort extraction of the in-progress `reply` string from a partial JSON
 * stream, so we can show text as it arrives. Handles common escapes.
 */
export function extractPartialReply(raw: string): string {
  const m = raw.match(/"reply"\s*:\s*"/);
  if (!m || m.index === undefined) return "";
  let out = "";
  for (let i = m.index + m[0].length; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "\\") {
      const next = raw[i + 1];
      if (next === undefined) break;
      out += next === "n" ? "\n" : next === "t" ? "\t" : next;
      i++;
    } else if (ch === '"') {
      break;
    } else {
      out += ch;
    }
  }
  return out;
}
