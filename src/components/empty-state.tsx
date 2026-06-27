import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Friendly empty state: an icon, a headline, a hint, and an optional action.
 * Use instead of a bare "nothing here" line so empty screens feel intentional.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="bg-muted text-muted-foreground mb-4 flex size-14 items-center justify-center rounded-full">
          <Icon className="size-7" aria-hidden />
        </div>
      )}
      <p className="text-lg font-semibold">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm text-pretty">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
