import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/provider";
import { buildSystemPrompt, REPLY_SCHEMA } from "@/lib/prompts";
import { getScenario } from "@/lib/scenarios";
import type {
  AssistantReply,
  LanguageCode,
  Level,
  ProviderMessageLike,
} from "@/lib/types";

export const runtime = "nodejs";

interface ChatBody {
  languageCode: LanguageCode;
  level: Level;
  scenarioId: string | null;
  vocab?: { word: string }[];
  messages: ProviderMessageLike[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatBody;

    const systemPrompt = buildSystemPrompt({
      languageCode: body.languageCode,
      level: body.level,
      scenario: getScenario(body.scenarioId),
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

    const parsed = JSON.parse(raw) as AssistantReply;
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
