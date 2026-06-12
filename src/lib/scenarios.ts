import type { Scenario } from "./types";

/**
 * Built-in scenarios. These are language-agnostic — the AI adapts the roleplay
 * to whichever target language the user has selected.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "cafe",
    title: "Ordering at a Café",
    description: "Order a drink and a snack from a friendly barista.",
    character: "Sam, a warm and chatty barista",
    situation:
      "The user walks into a cozy café. Greet them, take their order, make small talk, and total up the bill.",
    emoji: "☕",
  },
  {
    id: "directions",
    title: "Asking for Directions",
    description: "You're lost in a new city and need to find your way.",
    character: "A helpful local passer-by",
    situation:
      "The user stops you on the street asking how to get to a landmark. Give clear, simple directions and offer tips.",
    emoji: "🗺️",
  },
  {
    id: "interview",
    title: "Job Interview",
    description: "Practice answering questions in a professional setting.",
    character: "Ms. Tan, a friendly but professional hiring manager",
    situation:
      "The user is interviewing for a job. Ask about their background, strengths, and why they want the role.",
    emoji: "💼",
  },
  {
    id: "shopping",
    title: "Shopping for Clothes",
    description: "Browse, ask about sizes and prices, and make a purchase.",
    character: "An attentive clothing-store assistant",
    situation:
      "The user is shopping for clothes. Help them find items, discuss sizes, colours and prices, and check out.",
    emoji: "🛍️",
  },
  {
    id: "doctor",
    title: "At the Doctor's",
    description: "Describe symptoms and understand simple advice.",
    character: "Dr. Lee, a calm and reassuring family doctor",
    situation:
      "The user visits the doctor feeling unwell. Ask about their symptoms and give simple, reassuring advice.",
    emoji: "🩺",
  },
  {
    id: "smalltalk",
    title: "Making Small Talk",
    description: "Casual chat about hobbies, weekends, and daily life.",
    character: "A friendly new acquaintance at a social event",
    situation:
      "The user is at a relaxed social gathering. Chat casually about hobbies, weekends, food and daily life.",
    emoji: "💬",
  },
];

export function getScenario(id: string | null): Scenario | null {
  if (!id) return null;
  return SCENARIOS.find((s) => s.id === id) ?? null;
}
