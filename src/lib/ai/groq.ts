import type { AIProvider, ProviderRequest } from "./provider";

/**
 * Groq provider. Groq exposes an OpenAI-compatible Chat Completions API, so we
 * talk to it with the standard `messages` + `response_format` shape. Models
 * like `llama-3.3-70b-versatile` support JSON object mode but not Gemini-style
 * response schemas, so we describe the desired schema in the system prompt and
 * ask for a single JSON object back.
 */
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export class GroqProvider implements AIProvider {
  readonly name = "groq";

  private get apiKey(): string {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error(
        "GROQ_API_KEY is not set. Add it to .env.local (local) or your Vercel project environment variables.",
      );
    }
    return key;
  }

  private get model(): string {
    return process.env.AI_MODEL ?? "llama-3.3-70b-versatile";
  }

  async generate(req: ProviderRequest): Promise<string> {
    // Groq's JSON mode needs the schema in the prompt; the word "json" must
    // also appear in the conversation for `response_format: json_object`.
    const systemContent = req.jsonSchema
      ? `${req.systemPrompt}\n\nRespond with ONLY a single valid JSON object (no markdown, no commentary) that matches this JSON schema:\n${JSON.stringify(
          req.jsonSchema,
        )}`
      : req.systemPrompt;

    const body: Record<string, unknown> = {
      model: this.model,
      temperature: 0.8,
      messages: [
        { role: "system", content: systemContent },
        ...req.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      ...(req.jsonSchema
        ? { response_format: { type: "json_object" } }
        : {}),
    };

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Groq request failed (${res.status}): ${detail}`);
    }

    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("Groq returned an empty response.");
    }
    return text;
  }
}
