import { Skeleton } from "@/components/ui/skeleton";

/** Card-shaped skeletons for the events grid (instead of a bare spinner). */
export default function EventsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-2 h-5 w-72" />
      <Skeleton className="mt-6 h-10 w-full max-w-md" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
