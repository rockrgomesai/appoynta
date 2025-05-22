import { z } from "zod";
export const DepartmentSchema = z.object({
    id: z.number().optional(),
    department: z.string().min(1, 'Department is required'),
    status: z.enum(['Active', 'Inactive']).default('Active'),
  });

export type Department = z.infer<typeof DepartmentSchema>;