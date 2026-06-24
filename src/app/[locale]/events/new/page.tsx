import { getTranslations, setRequestLocale } from "next-intl/server";

import { EventForm } from "@/components/event-form";
import { createEvent } from "@/server/actions/event";
import { requireVerifiedOrganization } from "@/server/auth";

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireVerifiedOrganization();
  const t = await getTranslations("Event");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("createTitle")}
      </h1>
      <div className="mt-8">
        <EventForm action={createEvent} mode="create" />
      </div>
    </div>
  );
}
