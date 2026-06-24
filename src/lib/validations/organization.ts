import { z } from "zod";

/**
 * Organization application input. Validated on the server (server action) and
 * mirrored by the form. Field-level errors are mapped to localized messages in
 * the form, so the messages here are just fallbacks.
 */
export const organizationApplicationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is too short")
    .max(80, "Name is too long"),
  description: z
    .string()
    .trim()
    .min(20, "Description is too short")
    .max(1000, "Description is too long"),
});

export type OrganizationApplicationInput = z.infer<
  typeof organizationApplicationSchema
>;
