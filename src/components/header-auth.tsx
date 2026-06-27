"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { getNavState, type NavState } from "@/server/actions/nav";

type HeaderAuth = NavState & { loaded: boolean };

const DEFAULT: HeaderAuth = {
  userId: null,
  isAdmin: false,
  profileIncomplete: false,
  blocked: false,
  loaded: false,
};

const Ctx = createContext<HeaderAuth>(DEFAULT);

export function useHeaderAuth() {
  return useContext(Ctx);
}

/**
 * Fetches the current user's nav state once (client-side) and shares it with
 * the header widgets. This keeps Clerk `auth()` out of the server-rendered
 * layout so public pages stay static.
 */
export function HeaderAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<HeaderAuth>(DEFAULT);

  useEffect(() => {
    let cancelled = false;
    getNavState().then((s) => {
      if (!cancelled) setState({ ...s, loaded: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
