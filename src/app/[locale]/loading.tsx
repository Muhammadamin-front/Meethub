import { Spinner } from "@/components/spinner";

// Shown in the <main> area (header/footer persist) while a route segment loads.
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-32">
      <Spinner className="size-8" />
    </div>
  );
}
