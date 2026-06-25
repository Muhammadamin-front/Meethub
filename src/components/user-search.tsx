"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { UserAvatar } from "@/components/user-avatar";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { displayName } from "@/lib/utils";
import { searchPeople, type PersonResult } from "@/server/actions/social";

export function UserSearch() {
  const t = useTranslations("Social");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PersonResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search (>=2 chars).
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        setResults(await searchPeople(query));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {loading && (
        <p className="text-muted-foreground text-sm">{t("searching")}</p>
      )}

      {!loading && q.trim().length >= 2 && results.length === 0 && (
        <p className="text-muted-foreground text-sm">{t("noResults")}</p>
      )}

      {results.length > 0 && (
        <ul className="divide-border divide-y rounded-lg border">
          {results.map((u) => (
            <li key={u.id}>
              <Link
                href={`/u/${u.id}`}
                className="hover:bg-accent flex items-center gap-3 p-3 transition-colors"
              >
                <UserAvatar name={displayName(u.name)} imageUrl={u.imageUrl} />
                <span className="font-medium">{displayName(u.name)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
