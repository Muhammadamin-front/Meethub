import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Read-only star display. `value` may be fractional (e.g. an average). */
export function StarRating({
  value,
  size = "size-4",
  className,
}: {
  value: number;
  size?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i - 0.25;
        return (
          <Star
            key={i}
            className={cn(
              size,
              filled
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-zinc-400/50",
            )}
          />
        );
      })}
    </div>
  );
}
