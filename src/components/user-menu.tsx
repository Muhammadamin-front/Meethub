"use client";

import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, ShieldCheck, UserPen } from "lucide-react";

/**
 * The Clerk user avatar + dropdown. We add "Profile", "Dashboard" (and "Admin"
 * for admins) as custom menu items so they live under the avatar instead of
 * cluttering the top nav. Explicitly listing the built-in manageAccount /
 * signOut actions fixes the order.
 *
 * A red dot overlays the avatar until the user has completed their profile
 * (nickname + city). Hrefs are locale-prefixed by the caller.
 */
export function UserMenu({
  profileLabel,
  profileHref,
  dashboardLabel,
  dashboardHref,
  adminLabel,
  adminHref,
  profileIncomplete,
}: {
  profileLabel: string;
  profileHref: string;
  dashboardLabel: string;
  dashboardHref: string;
  adminLabel: string;
  adminHref?: string;
  profileIncomplete?: boolean;
}) {
  return (
    <span className="relative inline-flex">
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Action label="manageAccount" />
          <UserButton.Link
            label={profileLabel}
            labelIcon={<UserPen className="size-4" />}
            href={profileHref}
          />
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
      {profileIncomplete && (
        <span
          aria-hidden
          className="bg-destructive ring-background pointer-events-none absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2"
        />
      )}
    </span>
  );
}
