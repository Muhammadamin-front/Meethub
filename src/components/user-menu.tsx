"use client";

import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, ShieldCheck } from "lucide-react";

/**
 * The Clerk user avatar + dropdown. We add "Dashboard" (and "Admin" for admins)
 * as custom menu items so they live under the avatar instead of cluttering the
 * top nav. Explicitly listing the built-in `manageAccount` / `signOut` actions
 * fixes the order: Manage account → Dashboard → Admin → Sign out.
 *
 * Hrefs are locale-prefixed by the caller — Clerk navigates them as-is.
 */
export function UserMenu({
  dashboardLabel,
  dashboardHref,
  adminLabel,
  adminHref,
}: {
  dashboardLabel: string;
  dashboardHref: string;
  adminLabel: string;
  adminHref?: string;
}) {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Action label="manageAccount" />
        <UserButton.Link
          label={dashboardLabel}
          labelIcon={<LayoutDashboard className="size-4" />}
          href={dashboardHref}
        />
        {adminHref ? (
          <UserButton.Link
            label={adminLabel}
            labelIcon={<ShieldCheck className="size-4" />}
            href={adminHref}
          />
        ) : null}
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  );
}
