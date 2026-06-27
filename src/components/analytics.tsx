"use client";

import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { useEffect } from "react";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let initialized = false;

/**
 * Product analytics (PostHog). No-op until NEXT_PUBLIC_POSTHOG_KEY is set, so
 * dev/preview without a key just does nothing. Captures a pageview on each
 * client navigation (pathname change).
 */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!KEY || initialized) return;
    posthog.init(KEY, {
      api_host: HOST,
      capture_pageview: false, // captured manually on route change
      capture_pageleave: true,
    });
    initialized = true;
  }, []);

  useEffect(() => {
    if (!KEY || !initialized) return;
    posthog.capture("$pageview");
  }, [pathname]);

  return null;
}
