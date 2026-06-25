// `/events/new` is the create-event form, not an event id. Without this static
// interceptor, the `(.)events/[id]` modal route would capture it as id="new",
// look up a non-existent event, and render a 404 in the modal. A more specific
// `(.)events/new` match wins and renders nothing, so the real page shows.
export default function NewEventModalStop() {
  return null;
}
