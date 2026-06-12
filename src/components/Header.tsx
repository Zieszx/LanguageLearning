"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  Flame,
  Home,
  LogIn,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
} from "lucide-react";
import { useSettings } from "@/lib/useSettings";
import { resolveDark } from "@/lib/theme";
import { signOut } from "@/app/auth/actions";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/progress", label: "Progress", icon: Flame },
  { href: "/vocab", label: "Vocabulary", icon: BookMarked },
  { href: "/settings", label: "Settings", icon: Settings },
];

export interface HeaderAccount {
  isAdmin: boolean;
}

interface Props {
  /** Whether Supabase auth is configured at all. */
  authEnabled: boolean;
  /** Present when a user is signed in. */
  account: HeaderAccount | null;
}

export function Header({ authEnabled, account }: Props) {
  const pathname = usePathname();
  const { settings, update, loaded } = useSettings();
  const isDark = loaded && resolveDark(settings.theme);

  // Show the app nav when auth is off (local mode) or the user is signed in.
  const showNav = !authEnabled || account !== null;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-md">
            C
          </span>
          <span className="font-display text-xl text-foreground">Cakap</span>
        </Link>

        <nav className="flex items-center gap-1">
          {showNav &&
            NAV.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors duration-200 sm:w-auto sm:gap-2 sm:px-3 ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden text-sm font-semibold sm:inline">
                    {label}
                  </span>
                </Link>
              );
            })}

          {showNav && account?.isAdmin && (
            <Link
              href="/admin"
              aria-label="Admin"
              aria-current={pathname.startsWith("/admin") ? "page" : undefined}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors duration-200 sm:w-auto sm:gap-2 sm:px-3 ${
                pathname.startsWith("/admin")
                  ? "bg-secondary/15 text-secondary"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              <Shield className="h-5 w-5" />
              <span className="hidden text-sm font-semibold sm:inline">
                Admin
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => update({ theme: isDark ? "light" : "dark" })}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="ml-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-surface-2 hover:text-foreground"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {authEnabled && account !== null && (
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-surface-2 hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          )}

          {authEnabled && account === null && pathname !== "/login" && (
            <Link
              href="/login"
              aria-label="Sign in"
              className="flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/10"
            >
              <LogIn className="h-5 w-5" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
