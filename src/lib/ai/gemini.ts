import type { AIProvider, ProviderRequest } from "./provider";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  private get apiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it to .env.local (local) or your Vercel project environment variables.",
      );
    }
    return key;
  }

  private get model(): string {
    return process.env.AI_MODEL ?? "gemini-2.0-flash";
  }

  async generate(req: ProviderRequest): Promise<string> {
    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: req.systemPrompt }] },
      contents: req.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: 0.8,
        ...(req.jsonSchema
          ? {
              responseMimeType: "application/json",
              responseSchema: req.jsonSchema,
            }
          : {}),
      },
    };

    const res = await fetch(
      `${ENDPOINT}/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Gemini request failed (${res.status}): ${detail}`);
    }

    const data = await res.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }
    return text;
  }
}
