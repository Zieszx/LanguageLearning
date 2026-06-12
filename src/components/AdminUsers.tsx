"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, CircleCheck, Mail, Trash2, UserPlus } from "lucide-react";
import {
  deleteUser,
  inviteUser,
  setDisabled,
  setRole,
  type ActionResult,
} from "@/app/admin/actions";

export interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "user";
  disabled: boolean;
  createdAt: string;
  messagesToday: number;
}

export function AdminUsers({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(inviteUser, null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(id: string, fn: () => Promise<void>) {
    setPendingId(id);
    startTransition(async () => {
      await fn();
      setPendingId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Invite */}
      <section className="clay flex flex-col gap-3 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
          <UserPlus className="h-5 w-5 text-primary" />
          Invite a user
        </h2>
        <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            name="email"
            required
            placeholder="name@example.com"
            className="clay-inset flex-1 rounded-xl px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            name="role"
            defaultValue="user"
            aria-label="Role"
            className="clay-inset cursor-pointer rounded-xl px-4 py-2.5 text-foreground outline-none"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="clay-press flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {pending ? "Sending…" : "Send invite"}
          </button>
        </form>
        {state && (
          <p
            className={`text-sm ${
              state.ok ? "text-accent" : "text-red-600 dark:text-red-300"
            }`}
          >
            {state.message}
          </p>
        )}
      </section>

      {/* User list */}
      <ul className="flex flex-col gap-2">
        {users.map((u) => {
          const busy = pendingId === u.id;
          return (
            <li
              key={u.id}
              className="clay flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="truncate">{u.email}</span>
                  {u.role === "admin" && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                      admin
                    </span>
                  )}
                  {u.disabled && (
                    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-500">
                      disabled
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {u.messagesToday} messages today
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(u.id, () =>
                      setRole(u.id, u.role === "admin" ? "user" : "admin"),
                    )
                  }
                  className="clay-press clay-inset cursor-pointer rounded-xl px-3 py-1.5 text-sm font-semibold text-foreground disabled:opacity-50"
                >
                  {u.role === "admin" ? "Make user" : "Make admin"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(u.id, () => setDisabled(u.id, !u.disabled))}
                  className="clay-press clay-inset flex cursor-pointer items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-semibold text-foreground disabled:opacity-50"
                >
                  {u.disabled ? (
                    <>
                      <CircleCheck className="h-4 w-4" /> Enable
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4" /> Disable
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (confirm(`Delete ${u.email}? This cannot be undone.`)) {
                      run(u.id, () => deleteUser(u.id));
                    }
                  }}
                  aria-label={`Delete ${u.email}`}
                  className="clay-press flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-red-500 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
