import { displayName } from "@/lib/utils";
import type { AttendeePreview } from "@/server/attendees";

/**
 * Stacked attendee avatars + a "+N" overflow chip. Presentational; pass a small
 * sample of people and the true total.
 */
export function AttendeeAvatars({
  people,
  total,
  size = "size-7",
}: {
  people: AttendeePreview[];
  total: number;
  size?: string;
}) {
  if (total <= 0 || people.length === 0) return null;
  const extra = total - people.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {people.map((p, i) => (
          <div
            key={i}
            className={`bg-muted border-background ring-border relative overflow-hidden rounded-full border-2 ${size}`}
            title={displayName(p.name)}
          >
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.imageUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span className="text-muted-foreground flex size-full items-center justify-center text-[10px] font-semibold">
                {displayName(p.name).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        ))}
      </div>
      {extra > 0 && (
        <span className="text-muted-foreground ml-2 text-xs font-medium">
          +{extra}
        </span>
      )}
    </div>
  );
}
