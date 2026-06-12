"use client";

import { useEffect } from "react";
import { useAccount } from "@/lib/account";
import {
  getConversations,
  getCustomScenarios,
  getSettings,
  getVocab,
} from "@/lib/storage";
import { actionMigrateLocal } from "@/app/data-actions";

const FLAG = "cakap.v1.migrated";

/**
 * The first time a user is signed in on this browser, pushes any data they
 * created in local-only mode up to their account. Runs once (guarded by a
 * localStorage flag).
 */
export function MigrateOnLogin() {
  const { signedIn } = useAccount();

  useEffect(() => {
    if (!signedIn) return;
    try {
      if (localStorage.getItem(FLAG)) return;
      const vocab = getVocab();
      const conversations = getConversations();
      const characters = getCustomScenarios();
      const settings = getSettings();
      const hasData =
        vocab.length || conversations.length || characters.length;

      if (hasData) {
        void actionMigrateLocal({
          settings,
          vocab,
          conversations,
          characters,
        }).then(() => localStorage.setItem(FLAG, "1"));
      } else {
        localStorage.setItem(FLAG, "1");
      }
    } catch {
      /* ignore */
    }
  }, [signedIn]);

  return null;
}
