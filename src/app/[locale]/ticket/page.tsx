import { unstable_cache } from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Reveal } from "@/components/landing/reveal";
import { TicketCard } from "@/components/landing/ticket-card";
import { TicketTiers } from "@/components/landing/ticket-tiers";
import { prisma } from "@/server/db";

// Pull a real published event (if any) to populate the sample ticket.
const getSampleEvent = unstable_cache(
  async () => {
    const event = await prisma.event.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { startsAt: "asc" },
      select: {
        title: true,
        location: true,
        startsAt: true,
        organization: { select: { name: true } },
      },
    });
    return event;
  },
  ["ticket-sample-event"],
  { revalidate: 60 },
);

export default async function TicketPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");

  const event = await getSampleEvent();
  const date = event
    ? new Date(event.startsAt).toLocaleString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("ticketTitle")}
          </h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-pretty">
            {t("ticketSubtitle")}
          </p>
        </div>
      </Reveal>

      <TicketCard
        event={event ? { title: event.title, location: event.location } : null}
        organizer={event?.organization.name}
        date={date}
      />

      <p className="text-muted-foreground mx-auto mt-10 max-w-md text-center text-sm text-pretty">
        {t("ticket.pageNote")}
      </p>

      {/* Ticket tier explanation with mini example tickets */}
      <TicketTiers />
    </div>
  );
}
