import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/provider";
import { buildSystemPrompt, REPLY_SCHEMA } from "@/lib/prompts";
import { parseReply } from "@/lib/parseReply";
import { getScenario } from "@/lib/scenarios";
import type {
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
  /** When true, stream the raw model text back as it's generated. */
  stream?: boolean;
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
    const providerReq = {
      systemPrompt,
      messages,
      jsonSchema: REPLY_SCHEMA,
    };

    // Stream the raw model text when asked (and supported). The client shows
    // the reply as it arrives and parses the full JSON once the stream ends.
    if (body.stream && provider.generateStream) {
      const encoder = new TextEncoder();
      const iterator = provider.generateStream(providerReq);
      const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          try {
            const { value, done } = await iterator.next();
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(encoder.encode(value));
          } catch (e) {
            controller.error(e);
          }
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
        },
      });
    }

    const raw = await provider.generate(providerReq);
    const parsed = parseReply(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
