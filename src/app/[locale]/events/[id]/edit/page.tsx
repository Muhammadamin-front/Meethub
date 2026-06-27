import { getTranslations, setRequestLocale } from "next-intl/server";

import { EventForm } from "@/components/event-form";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { toDateTimeLocalValue } from "@/lib/utils";
import { updateEvent } from "@/server/actions/event";
import { requireManageableEvent } from "@/server/auth";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { event } = await requireManageableEvent(id);
  const t = await getTranslations("Event");

  const action = updateEvent.bind(null, id);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("editTitle")}
        </h1>
        <Link
          href={`/events/${id}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {event.title}
        </Link>
      </div>
      <div className="mt-8">
        <EventForm
          action={action}
          mode="edit"
          defaults={{
            title: event.title,
            description: event.description,
            location: event.location,
            city: event.city ?? "",
            latitude: event.latitude,
            longitude: event.longitude,
            category: event.category,
            theme: event.theme,
            startsAt: toDateTimeLocalValue(event.startsAt),
            endsAt: toDateTimeLocalValue(event.endsAt),
            capacity: event.capacity,
            coverUrl: event.coverUrl ?? "",
            registrationUrl: event.registrationUrl ?? "",
          }}
        />
      </div>
    </div>
  );
}
