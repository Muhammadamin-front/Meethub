import type { NextRequest } from "next/server";

import {
  EventStatus,
  NotificationType,
  RegistrationStatus,
} from "@/generated/prisma/client";
import { APP_URL } from "@/lib/constants";
import { prisma } from "@/server/db";
import { sendEmail } from "@/server/email";
import { createNotification } from "@/server/notifications";

const HOUR = 3_600_000;
const DAY = 86_400_000;
const PARTICIPANT = [RegistrationStatus.JOINED, RegistrationStatus.ATTENDED];

/**
 * Daily housekeeping cron (Vercel attaches `Authorization: Bearer $CRON_SECRET`):
 *  1. Finish events whose end time has passed (PUBLISHED -> FINISHED).
 *  2. Remind participants of events starting in the next 24h (in-app + email),
 *     de-duplicated via the EVENT_REMINDER notification so nobody is pinged twice.
 *  3. On Mondays, email a short weekly digest of upcoming events in the user's
 *     city.
 *
 * Consolidated into one route to stay within Vercel Hobby's 2-cron limit.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.get("authorization") !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();

  // 1) Finish past events.
  const { count: finished } = await prisma.event.updateMany({
    where: { status: EventStatus.PUBLISHED, endsAt: { lt: now } },
    data: { status: EventStatus.FINISHED },
  });

  // 2) Reminders for events starting within 24h.
  let reminded = 0;
  const soon = new Date(now.getTime() + 24 * HOUR);
  const upcoming = await prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      startsAt: { gte: now, lte: soon },
    },
    select: {
      id: true,
      title: true,
      registrations: {
        where: { status: { in: PARTICIPANT } },
        select: { userId: true, user: { select: { email: true } } },
      },
    },
  });

  for (const event of upcoming) {
    const userIds = event.registrations.map((r) => r.userId);
    if (userIds.length === 0) continue;

    // Who already got a reminder for this event?
    const already = await prisma.notification.findMany({
      where: {
        type: NotificationType.EVENT_REMINDER,
        userId: { in: userIds },
        data: { path: ["eventId"], equals: event.id },
      },
      select: { userId: true },
    });
    const sent = new Set(already.map((n) => n.userId));

    for (const reg of event.registrations) {
      if (sent.has(reg.userId)) continue;
      await createNotification({
        userId: reg.userId,
        type: NotificationType.EVENT_REMINDER,
        title: "Event reminder",
        body: `“${event.title}” is starting soon.`,
        data: { event: event.title, eventId: event.id },
      });
      await sendEmail(
        reg.user.email,
        `Reminder: ${event.title} is starting soon`,
        `<p>“${event.title}” is starting within 24 hours.</p>
         <p><a href="${APP_URL}/events/${event.id}">View the event →</a></p>`,
      );
      reminded += 1;
    }
  }

  // 3) Weekly digest (Mondays) — upcoming events in the user's city.
  let digested = 0;
  if (now.getUTCDay() === 1) {
    const users = await prisma.user.findMany({
      where: { email: { not: null }, city: { not: null }, isBlocked: false },
      select: { email: true, city: true },
    });
    const cities = [...new Set(users.map((u) => u.city!))];
    const weekEnd = new Date(now.getTime() + 7 * DAY);

    const eventsByCity = new Map<string, { id: string; title: string }[]>();
    for (const city of cities) {
      const evs = await prisma.event.findMany({
        where: {
          status: EventStatus.PUBLISHED,
          city,
          startsAt: { gte: now, lte: weekEnd },
        },
        orderBy: { startsAt: "asc" },
        take: 5,
        select: { id: true, title: true },
      });
      eventsByCity.set(city, evs);
    }

    for (const u of users) {
      const evs = eventsByCity.get(u.city!) ?? [];
      if (evs.length === 0) continue;
      const list = evs
        .map(
          (e) =>
            `<li><a href="${APP_URL}/events/${e.id}">${e.title}</a></li>`,
        )
        .join("");
      await sendEmail(
        u.email,
        `This week in ${u.city}: ${evs.length} events`,
        `<p>Upcoming events in ${u.city} this week:</p><ul>${list}</ul>
         <p><a href="${APP_URL}/events">See all events →</a></p>`,
      );
      digested += 1;
    }
  }

  return Response.json({ finished, reminded, digested });
}
