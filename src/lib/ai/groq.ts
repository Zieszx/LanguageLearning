import type { AIProvider, ProviderRequest } from "./provider";

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
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.8,
        messages: [
          { role: "system", content: req.systemPrompt },
          ...req.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        // Groq supports OpenAI-style JSON mode. The prompt describes the shape.
        ...(req.jsonSchema ? { response_format: { type: "json_object" } } : {}),
      }),
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
