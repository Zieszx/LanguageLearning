import { ShieldCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminUsers, type AdminUser } from "@/components/AdminUsers";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: profiles }, { data: usage }] = await Promise.all([
    admin
      .from("profiles")
      .select("id,email,role,disabled,created_at")
      .order("created_at", { ascending: true }),
    admin.from("usage").select("user_id,message_count").eq("day", today),
  ]);

  const usageMap = new Map(
    (usage ?? []).map((u) => [u.user_id, u.message_count]),
  );
  const users: AdminUser[] = (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email ?? "",
    role: p.role,
    disabled: p.disabled,
    createdAt: p.created_at,
    messagesToday: usageMap.get(p.id) ?? 0,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} {users.length === 1 ? "user" : "users"} · usage shown
            for today
          </p>
        </div>
      </div>
      <AdminUsers users={users} />
    </div>
  );
}
