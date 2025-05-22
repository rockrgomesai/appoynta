import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticate } from "@/lib/auth";
import { authorize } from "@/lib/permissions";
import { attendance_logs } from "@/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";

// Schema for validating POST request payload
const logSchema = z.object({
  appointment_id: z.number(),
  visitor_id: z.number(),
  badge_id: z.string().min(1),
  check_in_time: z.string(), // Required field
  check_out_time: z.string().optional(), // Optional field
  note: z.string().optional(),
});

// GET Handler: Fetch all attendance logs
export async function GET(req: Request) {
  const user = await authenticate(req);
  await authorize(user, "view:attendance_logs");

  const logs = await db.select().from(attendance_logs);
  return NextResponse.json(logs, { status: 200 });
}

// POST Handler: Create a new attendance log
export async function POST(req: Request) {
  const user = await authenticate(req);
  await authorize(user, "create:attendance_logs");

  const parsed = logSchema.parse(await req.json());

  // Prepare the data for insertion
  const formattedData = {
    ...parsed,
    check_in_time: new Date(parsed.check_in_time), // Convert to Date object
    check_out_time: parsed.check_out_time ? new Date(parsed.check_out_time) : undefined,
  };

  const [rec] = await db.insert(attendance_logs).values(formattedData).returning();
  return NextResponse.json(rec, { status: 201 });
}