import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

// Next 16 "proxy" convention (formerly "middleware").
// Clerk wraps next-intl: Clerk attaches the auth context, then next-intl
// handles locale detection/redirects for page routes. API routes (incl. the
// Clerk webhook) skip locale routing.
const handleI18nRouting = createMiddleware(routing);

export default clerkMiddleware((_auth, req) => {
  if (req.nextUrl.pathname.startsWith("/api")) return;
  return handleI18nRouting(req);
});

export const config = {
  // Run on everything except Next internals and static files (includes /api).
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
