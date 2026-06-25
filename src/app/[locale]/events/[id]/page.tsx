import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { EventDetail } from "@/components/event-detail";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/server/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { title: true, description: true },
  });
  if (!event) return {};

  // Short, clean description for link previews (Telegram/social).
  const description = event.description.replace(/\s+/g, " ").trim().slice(0, 160);
  return {
    title: event.title,
    description,
    // The opengraph-image.tsx in this segment is attached automatically.
    openGraph: { type: "article", title: event.title, description },
    twitter: { card: "summary_large_image", title: event.title, description },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("Event");

  // 404 early (before streaming the shell) so the status code is correct.
  const exists = await prisma.event.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) notFound();

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/events"
        className={`${buttonVariants({ variant: "ghost", size: "sm" })} mb-6 -ml-2`}
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToEvents")}
      </Link>

      <EventDetail locale={locale} id={id} />
    </article>
  );
}
