import * as z from "zod";

export const managerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  employee_id: z.string().optional(),
  department_id: z.string().min(1, "Department is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  joining_date: z.string().min(1, "Joining date is required"),
  status: z.enum(["active", "inactive", "on_leave"]),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type ManagerFormValues = z.infer<typeof managerFormSchema>;
