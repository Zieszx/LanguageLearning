"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS } from "./storage";
import { loadSettings, persistSettings } from "./data";
import { useAccount } from "./account";
import { applyTheme } from "./theme";
import type { Settings } from "./types";

/**
 * Loads settings (from Supabase when signed in, else localStorage) on mount and
 * persists updates back to the same place.
 */
export function useSettings() {
  const { signedIn } = useAccount();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void loadSettings(signedIn).then((stored) => {
      if (!active) return;
      setSettings(stored);
      applyTheme(stored.theme);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [signedIn]);

  const update = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        void persistSettings(signedIn, next);
        if (patch.theme) applyTheme(patch.theme);
        return next;
      });
    },
    [signedIn],
  );

  return { settings, update, loaded };
}
