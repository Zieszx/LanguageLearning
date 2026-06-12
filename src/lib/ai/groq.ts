import { parseSSE, type AIProvider, type ProviderRequest } from "./provider";

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

  private buildBody(req: ProviderRequest, stream: boolean): string {
    // Groq's JSON mode needs the schema in the prompt; the word "json" must
    // also appear in the conversation for `response_format: json_object`.
    const systemContent = req.jsonSchema
      ? `${req.systemPrompt}\n\nRespond with ONLY a single valid JSON object (no markdown, no commentary) that matches this JSON schema:\n${JSON.stringify(
          req.jsonSchema,
        )}`
      : req.systemPrompt;

    // Use JSON mode for non-streaming calls. For streaming we omit it — some
    // models reject `response_format` together with `stream`, and the prompt
    // above already mandates a single JSON object (parseReply tolerates it).
    const useJsonMode = Boolean(req.jsonSchema) && !stream;

    return JSON.stringify({
      model: this.model,
      temperature: 0.8,
      stream,
      messages: [
        { role: "system", content: systemContent },
        ...req.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
    });
  }

  private async post(req: ProviderRequest, stream: boolean): Promise<Response> {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: this.buildBody(req, stream),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Groq request failed (${res.status}): ${detail}`);
    }
    return res;
  }

  async generate(req: ProviderRequest): Promise<string> {
    const res = await this.post(req, false);
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("Groq returned an empty response.");
    return text;
  }

  async *generateStream(req: ProviderRequest): AsyncGenerator<string> {
    const res = await this.post(req, true);
    if (!res.body) throw new Error("Groq returned no stream.");
    for await (const payload of parseSSE(res.body)) {
      if (payload === "[DONE]") break;
      try {
        const json = JSON.parse(payload);
        const delta: string | undefined = json?.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        /* ignore keep-alive / partial lines */
      }
    }
  }
}
