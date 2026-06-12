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
}

import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";

/** Selects the active provider from env (defaults to Groq). */
export function getProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER ?? "groq").toLowerCase();
  switch (provider) {
    case "gemini":
      return new GeminiProvider();
    case "groq":
    default:
      return new GroqProvider();
  }
}
