"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Types out `text` one character at a time with a blinking caret.
 * Uses Array.from so multi-byte characters (e.g. emoji) aren't split.
 */
export function TypingText({
  text,
  className,
  speed = 45,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const chars = useMemo(() => Array.from(text), [text]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (chars.length === 0) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= chars.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [chars, speed]);

  const done = count >= chars.length;

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{chars.slice(0, count).join("")}</span>
      <span
        aria-hidden
        className={cn(
          "ml-0.5 inline-block h-[1em] w-0.5 translate-y-[0.15em] bg-current",
          done && "animate-pulse",
        )}
      />
    </span>
  );
}
