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
      try {
        const iterator = provider.generateStream(providerReq);
        // Pull the first chunk now: if the provider errors (bad key, model,
        // unsupported params), it throws HERE — caught below and handled as a
        // clean JSON response instead of a half-open stream that the platform
        // would turn into an HTML 500 page.
        const first = await iterator.next();
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              if (!first.done && first.value) {
                controller.enqueue(encoder.encode(first.value));
              }
              for (;;) {
                const { value, done } = await iterator.next();
                if (done) break;
                if (value) controller.enqueue(encoder.encode(value));
              }
            } catch {
              /* end the stream; client parses what arrived */
            }
            controller.close();
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      } catch {
        // Streaming failed before any output — fall back to a normal request.
      }
    }

    const raw = await provider.generate(providerReq);
    const parsed = parseReply(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
