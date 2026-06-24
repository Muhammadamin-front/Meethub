import { notFound } from "next/navigation";

// Any path under a locale that doesn't match a real route (e.g. /uz/unknown)
// falls through to here and renders the localized not-found page, instead of
// the English `global-not-found` used for non-route requests.
export default function CatchAllPage() {
  notFound();
}
