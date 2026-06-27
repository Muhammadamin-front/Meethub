import { cn } from "@/lib/utils";

/** Animated placeholder block shown while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-muted animate-pulse rounded-md", className)} />;
}
