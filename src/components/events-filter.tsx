"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const chip =
  "rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted";
const chipActive =
  "border-primary bg-primary text-primary-foreground hover:bg-primary";

export function EventsFilter({
  categories,
  q,
  category,
}: {
  categories: string[];
  q: string;
  category: string;
}) {
  const t = useTranslations("Event");
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(q);

  function push(nextSearch: string, nextCategory: string) {
    const params = new URLSearchParams();
    if (nextSearch) params.set("q", nextSearch);
    if (nextCategory) params.set("category", nextCategory);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  // Debounce the search box; category clicks navigate immediately.
  useEffect(() => {
    if (search === q) return;
    const id = setTimeout(() => push(search, category), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="mt-6 space-y-3">
      <div className="relative max-w-md">
        <Search
          className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => push(search, "")}
            className={cn(chip, !category && chipActive)}
          >
            {t("allCategories")}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => push(search, c)}
              className={cn(chip, category === c && chipActive)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
