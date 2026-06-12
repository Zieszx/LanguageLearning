"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Throws unless the caller is a signed-in admin. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") throw new Error("Admins only.");
  return user;
}

export type ActionResult = { ok: boolean; message: string };

export async function inviteUser(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const email = String(formData.get("email") ?? "").trim();
    const makeAdmin = formData.get("role") === "admin";
    if (!email) return { ok: false, message: "Email is required." };

    const admin = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/confirm?next=/set-password`,
    });
    if (error) return { ok: false, message: error.message };

    if (makeAdmin && data.user) {
      await admin
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", data.user.id);
    }

    revalidatePath("/admin");
    return { ok: true, message: `Invite sent to ${email}.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Failed." };
  }
}

export async function setRole(userId: string, role: "admin" | "user") {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/admin");
}

export async function setDisabled(userId: string, disabled: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("profiles").update({ disabled }).eq("id", userId);
  revalidatePath("/admin");
}

export async function deleteUser(userId: string) {
  const me = await requireAdmin();
  if (me.id === userId) throw new Error("You can’t delete your own account.");
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
  revalidatePath("/admin");
}
