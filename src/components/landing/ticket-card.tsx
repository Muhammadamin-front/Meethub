import { CalendarDays, CheckCircle2, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/logo";

// A decorative QR-code lookalike (not a real scannable code).
function FakeQR({ className }: { className?: string }) {
  const cells = [
    [1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 1, 1, 0, 0, 1, 0, 1, 1],
    [0, 0, 0, 1, 1, 0, 1, 0, 0],
    [1, 1, 0, 1, 0, 1, 0, 1, 1],
    [0, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 1, 1, 0, 0, 1, 0, 1, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 0],
    [1, 1, 1, 0, 1, 1, 0, 1, 1],
  ];
  return (
    <svg
      viewBox="0 0 9 9"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {cells.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill="currentColor"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

/**
 * A real attendee ticket. All fields are required and come from the user's
 * registration — there is no placeholder/sample data.
 */
export async function TicketCard({
  title,
  location,
  participant,
  organizer,
  ticketId,
  date,
}: {
  title: string;
  location: string;
  participant: string;
  organizer: string;
  ticketId: string;
  date: string;
}) {
  const t = await getTranslations("Landing");

  return (
    <div className="animate-ticket-in relative mx-auto w-full max-w-2xl">
      {/* Soft gradient glow behind the ticket */}
      <div
        aria-hidden
        className="from-primary/40 absolute -inset-3 rounded-[2rem] bg-linear-to-br to-blue-500/40 opacity-70 blur-2xl"
      />

      {/* Stacks on mobile (flex-col), splits body/stub on >=640px (grid). The
          .ticket-notch mask only kicks in on >=640px (see globals.css). */}
      <div className="ticket-notch glass relative flex flex-col overflow-hidden rounded-[1.75rem] shadow-2xl sm:grid sm:grid-cols-[1fr_auto]">
        {/* Left gradient accent rail */}
        <div className="from-primary absolute inset-y-0 left-0 w-1.5 bg-linear-to-b to-blue-600" />

        {/* ---- Main body ---- */}
        <div className="px-6 py-6 sm:pr-5 sm:pl-7">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-auto" />
              <span className="font-semibold tracking-tight">
                Meet<span className="text-primary">Hub</span>
              </span>
              <span className="text-muted-foreground text-xs font-medium">
                Pro
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-500">
              <CheckCircle2 className="size-3.5" />
              {t("ticket.confirmed")}
            </span>
          </div>

          {/* Event */}
          <p className="text-muted-foreground mt-5 text-[11px] font-medium tracking-widest uppercase">
            {t("ticket.event")}
          </p>
          <h3 className="mt-1 text-xl leading-snug font-bold sm:text-2xl">
            {title}
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("ticket.organizer")}: {organizer}
          </p>

          {/* Date + Location */}
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase">
                {t("ticket.date")}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                <CalendarDays className="text-primary size-4 shrink-0" />
                {date}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase">
                {t("ticket.location")}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="text-primary size-4 shrink-0" />
                {location}
              </p>
            </div>
          </div>

          {/* Participant */}
          <div className="border-border/40 mt-5 border-t pt-4">
            <p className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase">
              {t("ticket.participant")}
            </p>
            <p className="mt-1 text-base font-semibold">{participant}</p>
          </div>
        </div>

        {/* ---- Tear-off stub: a row on mobile, a column on >=640px ---- */}
        <div className="border-border/50 relative flex w-full items-center justify-center gap-5 border-t-2 border-dashed px-6 py-5 sm:w-40 sm:flex-col sm:gap-3 sm:border-t-0 sm:border-l-2 sm:px-4 sm:py-6">
          <span className="text-muted-foreground hidden text-[10px] font-semibold tracking-[0.2em] uppercase sm:block">
            {t("ticket.admitOne")}
          </span>
          <div className="rounded-xl bg-white p-2 shadow-sm">
            <FakeQR className="text-foreground size-20 sm:size-24" />
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
              {t("ticket.ticketId")}
            </p>
            <p className="text-primary font-mono text-xs font-semibold">
              #{ticketId}
            </p>
          </div>
          <span className="text-muted-foreground hidden text-center text-[10px] sm:block">
            {t("ticket.scanHint")}
          </span>
        </div>
      </div>
    </div>
  );
}
