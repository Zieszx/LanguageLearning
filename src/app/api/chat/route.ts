import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/provider";
import { buildSystemPrompt, REPLY_SCHEMA } from "@/lib/prompts";
import { getScenario } from "@/lib/scenarios";
import type {
  AssistantReply,
  LanguageCode,
  Level,
  ProviderMessageLike,
  Scenario,
} from "@/lib/types";

export const runtime = "nodejs";

interface ChatBody {
  languageCode: LanguageCode;
  level: Level;
  scenarioId: string | null;
  /** Inline character snapshot for user-created characters (the server can't
   *  read the browser-stored custom scenario list, so the client sends it). */
  scenario?: { character: string; situation: string } | null;
  vocab?: { word: string }[];
  messages: ProviderMessageLike[];
}

/**
 * Parses the model's reply defensively. Even with JSON mode, models can wrap
 * output in markdown fences or omit optional fields, so we strip fences, pull
 * out the JSON object, and backfill anything missing.
 */
function parseReply(raw: string): AssistantReply {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start > 0 || end < text.length - 1) {
    if (start !== -1 && end !== -1) text = text.slice(start, end + 1);
  }

  const data = JSON.parse(text) as Partial<AssistantReply>;
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatBody;

    // Prefer the inline character snapshot (custom characters); otherwise fall
    // back to resolving a built-in scenario by id.
    const builtIn = getScenario(body.scenarioId);
    const scenario: Scenario | null = body.scenario
      ? {
          id: body.scenarioId ?? "custom",
          title: builtIn?.title ?? "Custom character",
          description: "",
          character: body.scenario.character,
          situation: body.scenario.situation,
          emoji: builtIn?.emoji ?? "🎭",
        }
      : builtIn;

    const systemPrompt = buildSystemPrompt({
      languageCode: body.languageCode,
      level: body.level,
      scenario,
      // Only the `word` field is needed for the prompt.
      vocab: (body.vocab ?? []).map((v) => ({
        word: v.word,
        meaning: "",
        id: "",
        language: body.languageCode,
        createdAt: 0,
      })),
    });

    // Gemini needs at least one turn; if the chat is just starting, ask the
    // assistant to open the conversation.
    const messages =
      body.messages.length > 0
        ? body.messages
        : [{ role: "user" as const, content: "Please start the conversation." }];

    const provider = getProvider();
    const raw = await provider.generate({
      systemPrompt,
      messages,
      jsonSchema: REPLY_SCHEMA,
    });

    const parsed = parseReply(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
