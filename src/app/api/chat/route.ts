import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/provider";
import { buildSystemPrompt, REPLY_SCHEMA } from "@/lib/prompts";
import { getScenario } from "@/lib/scenarios";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

const DAILY_LIMIT = Number(process.env.DAILY_MESSAGE_LIMIT ?? "100");

export async function POST(request: Request) {
  try {
    // --- Auth: must be a signed-in, non-disabled user ---------------------
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("disabled")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.disabled) {
      return NextResponse.json(
        { error: "Your account has been disabled." },
        { status: 403 },
      );
    }

    // --- Rate limit: protect the shared AI quota --------------------------
    const today = new Date().toISOString().slice(0, 10);
    const { data: usage } = await admin
      .from("usage")
      .select("message_count")
      .eq("user_id", user.id)
      .eq("day", today)
      .maybeSingle();
    if ((usage?.message_count ?? 0) >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: "Daily message limit reached. Please try again tomorrow." },
        { status: 429 },
      );
    }

    // --- Generate the assistant turn --------------------------------------
    const body = (await request.json()) as ChatBody;
    const systemPrompt = buildSystemPrompt({
      languageCode: body.languageCode,
      level: body.level,
      scenario: getScenario(body.scenarioId),
      vocab: (body.vocab ?? []).map((v) => ({
        word: v.word,
        meaning: "",
        id: "",
        language: body.languageCode,
        createdAt: 0,
      })),
    });

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

    // Count this successful message against the user's daily allowance.
    await admin.rpc("increment_usage", { p_user_id: user.id });

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
