import { z } from "zod";

export const areaSchema = z.object({
  department_id: z.string().uuid("Please select a valid department"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  description: z.string().max(255, "Description must be less than 255 characters").optional().nullable(),
  is_active: z.boolean().default(true),
});

export type AreaFormValues = z.infer<typeof areaSchema>;
