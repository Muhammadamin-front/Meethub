"use server";

import { UserRole } from "@/generated/prisma/client";
import { getCurrentUser } from "@/server/auth";

export type NavState = {
  userId: string | null;
  isAdmin: boolean;
  profileIncomplete: boolean;
  blocked: boolean;
};

const SIGNED_OUT: NavState = {
  userId: null,
  isAdmin: false,
  profileIncomplete: false,
  blocked: false,
};

/**
 * Auth-derived header state, fetched client-side after paint. Keeping it out of
 * the server-rendered layout means the layout (and the public pages under it)
 * no longer call Clerk `auth()` and can be statically rendered / ISR'd.
 */
export async function getNavState(): Promise<NavState> {
  const u = await getCurrentUser();
  if (!u) return SIGNED_OUT;
  return {
    userId: u.id,
    isAdmin: u.role === UserRole.ADMIN,
    profileIncomplete: !u.nickname || !u.city,
    blocked: u.isBlocked,
  };
}
