import { parseSSE, type AIProvider, type ProviderRequest } from "./provider";

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

  private buildBody(req: ProviderRequest): string {
    return JSON.stringify({
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
    });
  }

  async generate(req: ProviderRequest): Promise<string> {
    const res = await fetch(
      `${ENDPOINT}/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: this.buildBody(req),
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

  async *generateStream(req: ProviderRequest): AsyncGenerator<string> {
    const res = await fetch(
      `${ENDPOINT}/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: this.buildBody(req),
      },
    );
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Gemini request failed (${res.status}): ${detail}`);
    }
    if (!res.body) throw new Error("Gemini returned no stream.");

    for await (const payload of parseSSE(res.body)) {
      try {
        const json = JSON.parse(payload);
        const text: string | undefined =
          json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch {
        /* ignore */
      }
    }
  }
}
