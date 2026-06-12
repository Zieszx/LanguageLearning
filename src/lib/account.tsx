"use client";

import { createContext, useContext } from "react";

export interface Account {
  /** True when a Supabase user is signed in (data syncs to the cloud). */
  signedIn: boolean;
}

const AccountContext = createContext<Account>({ signedIn: false });

export function AccountProvider({
  value,
  children,
}: {
  value: Account;
  children: React.ReactNode;
}) {
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount(): Account {
  return useContext(AccountContext);
}
