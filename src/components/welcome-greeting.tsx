import { getTranslations } from "next-intl/server";

import { TypingText } from "@/components/typing-text";
import { displayName } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth";

/** Personalized typing welcome for signed-in users; null when signed out. */
export async function WelcomeGreeting() {
  const user = await getCurrentUser();
  if (!user) return null;

  const t = await getTranslations("Welcome");

  return (
    <TypingText
      text={t("greeting", { name: displayName(user.name) })}
      className="border-primary/20 bg-primary/10 text-primary inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium"
    />
  );
}
