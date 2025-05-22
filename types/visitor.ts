import { z } from "zod";

export const Visitor = z.object({
    id: z.number().optional(), // Optional for new users
    name:     z.string().min(1, 'Name is required'),
    email: z.union([
      z.literal("").nullable(),                 // allow empty
      z.string().email("Invalid email")
    ]).nullable().optional(), 
    phone:    z.string().min(11, 'Phone is required'),
    whatsapp: z.enum(['Yes', 'No']).default('No'),
    gender:   z.enum(['Male', 'Female', 'Other']),
    company:  z.string().optional(),
    nid:      z.string().optional(),
    image_pp:  z.string().optional(),
    note:     z.string().optional(),
    status:   z.enum(['Active', 'Inactive']).default('Active'),
  });

export type Visitor = z.infer<typeof Visitor>;