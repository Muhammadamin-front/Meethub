import { EventDetail } from "@/components/event-detail";
import { EventModal } from "@/components/event-modal";

// Intercepts soft navigations to /events/[id] and shows them in a modal.
// A direct visit / refresh renders the full page instead.
export default async function EventModalPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return (
    <EventModal>
      <EventDetail locale={locale} id={id} />
    </EventModal>
  );
}
