/**
 * Decorative cover for events without an uploaded photo.
 *
 * Instead of falling back to one shared placeholder image (which makes every
 * photo-less event look identical — and broken), we pick a gradient from a
 * fixed palette by hashing the event id. Each event gets a distinct but stable
 * colour, so the events grid looks intentional even before organizers add real
 * cover photos.
 */

// Each entry is a [from, to] pair of dark, saturated colours that keep white
// overlay text readable. Order is stable — don't reshuffle or existing events
// would change colour.
const GRADIENTS: readonly [string, string][] = [
  ["#0f766e", "#042f2e"], // emerald
  ["#4338ca", "#1e1b4b"], // indigo
  ["#7c3aed", "#2e1065"], // violet
  ["#be185d", "#500724"], // rose
  ["#c2410c", "#431407"], // orange
  ["#0369a1", "#082f49"], // sky
  ["#0f766e", "#134e4a"], // teal
  ["#a21caf", "#4a044e"], // fuchsia
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** A stable CSS gradient for an event without a cover photo. */
export function coverGradient(seed: string): string {
  const [from, to] = GRADIENTS[hash(seed) % GRADIENTS.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}
