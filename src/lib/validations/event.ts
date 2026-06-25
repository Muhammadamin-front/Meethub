import { z } from "zod";

/**
 * Event create/edit input. Validated on the server; the form mirrors it and
 * maps field errors to localized messages.
 */
export const eventSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(10).max(5000),
    location: z.string().trim().min(2).max(200),
    category: z.string().trim().min(2).max(50),
    theme: z
      .enum(["LIGHT_MINIMAL", "DARK_MODERN", "GRADIENT", "NEO_BRUTAL", "GLASS"])
      .default("LIGHT_MINIMAL"),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    capacity: z.coerce.number().int().min(1).max(100000),
    coverUrl: z.union([z.string().url(), z.literal("")]).optional(),
    // Optional map coordinates from the location picker. Empty string -> null.
    latitude: z
      .union([z.coerce.number().min(-90).max(90), z.literal("")])
      .optional(),
    longitude: z
      .union([z.coerce.number().min(-180).max(180), z.literal("")])
      .optional(),
  })
  .refine((d) => d.endsAt > d.startsAt, {
    path: ["endsAt"],
    message: "End time must be after the start time",
  });

export type EventInput = z.infer<typeof eventSchema>;
export type EventField = keyof EventInput;
