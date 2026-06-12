"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addSharedScenarioDb, removeSharedScenarioDb } from "@/lib/db";
import type { LanguageCode } from "@/lib/types";

/** Promotes or demotes a user. Admin-only. */
export async function setUserRole(userId: string, role: "user" | "admin") {
  const admin = await requireAdmin();
  // Don't let an admin change their own role (avoids self-lockout).
  if (admin.id === userId) return;

  const supabase = await createClient();
  await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/admin");
}

/** Creates a shared scenario from the admin form. Admin-only. */
export async function createSharedScenario(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const character = String(formData.get("character") ?? "").trim();
  if (!title || !character) return;

  const language = String(formData.get("language") ?? "").trim();
  await addSharedScenarioDb({
    title,
    description: character,
    character,
    situation:
      String(formData.get("situation") ?? "").trim() ||
      `Stay fully in character as ${title} and chat with the learner.`,
    emoji: String(formData.get("emoji") ?? "🎭").trim() || "🎭",
    languageCode: language ? (language as LanguageCode) : undefined,
  });
  revalidatePath("/admin");
  revalidatePath("/");
}

/** Removes a shared scenario. Admin-only. */
export async function deleteSharedScenario(id: string) {
  await requireAdmin();
  await removeSharedScenarioDb(id);
  revalidatePath("/admin");
  revalidatePath("/");
}
