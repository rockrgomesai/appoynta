import { z } from "zod";

export const UserSchema = z.object({
  id: z.number().optional(), // Optional for new users
  first_name: z.string().min(1),
  last_name: z.string().min(1).optional(),
  username:  z.string().min(3),
  email:     z.string().email().optional(),
  telephone: z.string().min(11),
  password:  z.string().min(8).optional(),  
  department_id: z.number().int(),
  designation_id: z.number().int(),
  department: z.string().optional(), // Optional for new users
  designation: z.string().optional(), // Optional for new users
  role_id:    z.number().int(),
  status:    z.enum(['Active','Inactive']).default('Active'),
  role_name: z.string().optional(), // Optional for new users
});

export type User = z.infer<typeof UserSchema>;