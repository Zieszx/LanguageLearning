"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, LogIn, Sparkles, UserPlus } from "lucide-react";
import { login, signup, type AuthState } from "./actions";

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const [mode, setMode] = useState<"login" | "signup">("login");

  const action = mode === "login" ? login : signup;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 pt-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-2xl font-bold text-primary-foreground shadow-md">
          C
        </span>
        <h1 className="font-display text-2xl text-foreground">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Practice languages, your way.
        </p>
      </div>

      <form action={formAction} className="clay flex flex-col gap-4 p-6">
        <input type="hidden" name="next" value={next} />

        {mode === "signup" && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-muted-foreground">
              Name
            </span>
            <input
              name="display_name"
              autoComplete="name"
              placeholder="Your name"
              className="clay-inset rounded-2xl px-4 py-2.5 text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-muted-foreground">
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="clay-inset rounded-2xl px-4 py-2.5 text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-muted-foreground">
            Password
          </span>
          <input
            name="password"
            type="password"
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            className="clay-inset rounded-2xl px-4 py-2.5 text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>

        {state.error && (
          <p className="rounded-2xl bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-300">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="rounded-2xl bg-accent/10 px-4 py-2 text-sm text-accent">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="clay-press flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-display text-lg text-primary-foreground transition-opacity disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : mode === "login" ? (
            <LogIn className="h-5 w-5" />
          ) : (
            <UserPlus className="h-5 w-5" />
          )}
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="cursor-pointer font-semibold text-primary hover:underline"
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="clay h-40 animate-pulse rounded-3xl" />}>
      <LoginInner />
    </Suspense>
  );
}
