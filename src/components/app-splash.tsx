"use client";

import { useEffect, useState } from "react";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

/**
 * Branded boot splash. It's part of the server-rendered HTML, so it paints
 * immediately (no white flash before the app loads), then fades out once React
 * hydrates. The background is an explicit dark tone — not theme-dependent — so
 * it can never flash white regardless of the active theme.
 */
export function AppSplash() {
  const [hydrated, setHydrated] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // Defer to the next frame so the splash paints once before it fades.
    const raf = requestAnimationFrame(() => setHydrated(true));
    // Remove from the DOM after the fade so it can't trap pointer events.
    const t = setTimeout(() => setGone(true), 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-200 flex flex-col items-center justify-center gap-5 bg-[#0b1020] text-white transition-opacity duration-500",
        hydrated && "pointer-events-none opacity-0",
      )}
    >
      <div className="flex items-center gap-2">
        <Logo className="size-10" />
        <span className="text-2xl font-semibold tracking-tight">
          Meet<span className="text-primary">Hub</span>
        </span>
      </div>
      <div className="border-primary/30 border-t-primary size-7 animate-spin rounded-full border-[3px]" />
    </div>
  );
}
