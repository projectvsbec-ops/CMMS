import { z } from "zod";

export const departmentSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  description: z.string().max(255, "Description must be less than 255 characters").optional().nullable(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;
