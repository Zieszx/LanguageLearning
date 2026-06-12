"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, Home, Moon, Settings, ShieldCheck, Sun } from "lucide-react";
import { useSettings } from "@/lib/useSettings";
import { resolveDark } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

const BASE_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/vocab", label: "Vocabulary", icon: BookMarked },
  { href: "/settings", label: "Settings", icon: Settings },
];
const ADMIN_NAV = { href: "/admin", label: "Admin", icon: ShieldCheck };

const HIDDEN_ON = ["/login", "/auth", "/set-password"];

export function Header() {
  const pathname = usePathname();
  const { settings, update, loaded } = useSettings();
  const isDark = loaded && resolveDark(settings.theme);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (active) setIsAdmin(data?.role === "admin");
    })();
    return () => {
      active = false;
    };
  }, [pathname]);

  const NAV = isAdmin ? [...BASE_NAV, ADMIN_NAV] : BASE_NAV;

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={36} className="shadow-md" />
          <span className="font-display text-xl text-foreground">Cakap</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
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

          <button
            type="button"
            onClick={() => update({ theme: isDark ? "light" : "dark" })}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="ml-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-surface-2 hover:text-foreground"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
