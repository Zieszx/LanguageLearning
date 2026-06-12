/**
 * Provider-agnostic AI interface. The rest of the app only ever talks to this
 * interface, so switching providers (Gemini -> Claude -> ...) is a one-file
 * change selected by environment variables.
 */

export interface ProviderMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProviderRequest {
  systemPrompt: string;
  messages: ProviderMessage[];
  /** JSON schema for structured output. */
  jsonSchema?: object;
}

export interface AIProvider {
  readonly name: string;
  /** Returns the raw model text (a JSON string when `jsonSchema` is supplied). */
  generate(req: ProviderRequest): Promise<string>;
  /** Streams the raw model text in chunks, if the provider supports it. */
  generateStream?(req: ProviderRequest): AsyncGenerator<string>;
}

/**
 * Parses an SSE byte stream, yielding the `data:` payload strings. Shared by
 * providers that speak Server-Sent Events (Groq, Gemini).
 */
export async function* parseSSE(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:")) {
        yield trimmed.slice(5).trim();
      }
    }
  }
}

import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";

/** Selects the active provider from env (defaults to Gemini). */
export function getProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
  switch (provider) {
    case "groq":
      return new GroqProvider();
    case "gemini":
    default:
      return new GeminiProvider();
  }
}
