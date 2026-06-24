import { getTranslations, setRequestLocale } from "next-intl/server";

import { AttendanceActions } from "@/components/attendance-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { RegistrationStatus } from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { requireManageableEvent } from "@/server/auth";
import { prisma } from "@/server/db";

const STATUS_KEY = {
  [RegistrationStatus.JOINED]: "joined",
  [RegistrationStatus.ATTENDED]: "attended",
  [RegistrationStatus.NO_SHOW]: "noShow",
} as const;

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { event } = await requireManageableEvent(id);
  const t = await getTranslations("Attendance");

  const regs = await prisma.registration.findMany({
    where: { eventId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{event.title}</p>
        </div>
        <Link
          href={`/events/${id}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {t("backToEvent")}
        </Link>
      </div>

      {regs.length === 0 ? (
        <p className="text-muted-foreground mt-10">{t("noParticipants")}</p>
      ) : (
        <ul className="mt-8 divide-y rounded-lg border">
          {regs.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{r.user.name}</p>
                {r.user.email && (
                  <p className="text-muted-foreground text-sm">
                    {r.user.email}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {t(`status.${STATUS_KEY[r.status]}`)}
                </Badge>
                <AttendanceActions
                  eventId={id}
                  userId={r.user.id}
                  status={r.status}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
