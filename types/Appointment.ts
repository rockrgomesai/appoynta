import { z } from "zod";

export const appointmentSchema = z
  .object({
    appointment_type: z.enum(["Meeting","Project", "Program", "Demo", "Delivery", "Personal", "Interview", "Maintenance"]),
    topic: z.string().min(2, "Topic is required"),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    start_time: z.string(), // HH:MM
    end_time: z.string(), // HH:MM
    note: z.string().optional(),
    status: z.enum(["draft", "confirmed", "cancelled"]),
  })
  .superRefine((data, ctx) => {
    if (data.end_date < data.start_date) {
        
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be after start date",
      });
    }
  });