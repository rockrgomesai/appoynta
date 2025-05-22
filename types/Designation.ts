import { z } from "zod";
export const DesignationSchema = z.object({
    id: z.number().optional(),
    designation: z.string().min(1, 'Designation is required'),
    status: z.enum(['Active', 'Inactive']).default('Active'),
  });

export type Designation = z.infer<typeof DesignationSchema>;