import { TicketX } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Reveal } from "@/components/landing/reveal";
import { TicketCard } from "@/components/landing/ticket-card";
import { buttonVariants } from "@/components/ui/button";
import { EventStatus, RegistrationStatus } from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { EVENT_TZ } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";

// A readable, ticket-looking id derived from the registration.
function formatTicketId(regId: string, startsAt: Date): string {
  return `MH-${startsAt.getFullYear()}-${regId.slice(-4).toUpperCase()}`;
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");

  const user = await getCurrentUser();

  // The signed-in user's upcoming tickets (active registrations to events that
  // haven't started yet). No user / no tickets => empty state below.
  const registrations = user
    ? await prisma.registration.findMany({
        where: {
          userId: user.id,
          status: {
            in: [RegistrationStatus.JOINED, RegistrationStatus.ATTENDED],
          },
          event: {
            status: EventStatus.PUBLISHED,
            startsAt: { gte: new Date() },
          },
        },
        orderBy: { event: { startsAt: "asc" } },
        take: 20,
        select: {
          id: true,
          event: {
            select: {
              title: true,
              location: true,
              startsAt: true,
              organization: { select: { name: true } },
            },
          },
        },
      })
    : [];

  const hasTickets = registrations.length > 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("ticketTitle")}
          </h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-pretty">
            {hasTickets ? t("ticket.realSubtitle") : t("ticketSubtitle")}
          </p>
        </div>
      </Reveal>

      {hasTickets ? (
        <div className="space-y-12">
          {registrations.map((reg) => (
            <TicketCard
              key={reg.id}
              title={reg.event.title}
              location={reg.event.location}
              organizer={reg.event.organization.name}
              participant={user!.name}
              ticketId={formatTicketId(reg.id, reg.event.startsAt)}
              date={new Date(reg.event.startsAt).toLocaleString(locale, {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: EVENT_TZ,
              })}
            />
          ))}
        </div>
      ) : (
        <div className="border-border/60 bg-card/40 mx-auto max-w-md rounded-2xl border p-10 text-center">
          <TicketX className="text-muted-foreground mx-auto size-10" />
          <h2 className="mt-4 text-lg font-semibold">{t("ticket.noneTitle")}</h2>
          <p className="text-muted-foreground mt-2 text-sm text-pretty">
            {t("ticket.noneBody")}
          </p>
          <Link
            href="/events"
            className={buttonVariants({ size: "lg", className: "mt-6" })}
          >
            {t("ticket.browse")}
          </Link>
        </div>
      )}
    </div>
  );
}
