import { z } from "zod";

export const workerSchema = z.object({
  employee_id: z.string().min(1, "Employee ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  department_id: z.string().uuid("Please select a department"),
  area_id: z.string().uuid("Please select an area").optional().nullable(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number")
    .optional()
    .nullable()
    .or(z.literal("")),
  joining_date: z.string().min(1, "Joining date is required"),
  status: z.enum(["active", "inactive", "on_leave"]).default("active"),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export type WorkerFormValues = z.infer<typeof workerSchema>;
