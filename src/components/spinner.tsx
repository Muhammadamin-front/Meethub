import { cn } from "@/lib/utils";

/** Minimal CSS spinner (no icon dependency). */
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "border-muted border-t-foreground size-6 animate-spin rounded-full border-2",
        className,
      )}
    />
  );
}
