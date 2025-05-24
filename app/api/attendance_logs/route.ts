import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticate } from "@/lib/auth";
import { authorize } from "@/lib/permissions";
import { attendance_logs } from "@/db/schema";
import { z } from "zod";

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

  // Function to parse Bangladesh time string to UTC Date
  const parseBangladeshTime = (timeString: string | undefined) => {
    if (!timeString) return undefined;

    // Split the date-time string (format: "YYYY-MM-DD HH:mm:ss")
    const [datePart, timePart] = timeString.split(" ");
    const [year, month, day] = datePart.split("-");
    const [hours, minutes, seconds] = timePart.split(":");

    // Create date object with UTC time
    return new Date(
      Date.UTC(
        parseInt(year),
        parseInt(month) - 1, // months are 0-based
        parseInt(day),
        parseInt(hours) - 6, // Convert Bangladesh time (UTC+6) to UTC
        parseInt(minutes),
        parseInt(seconds)
      )
    );
  };

  // Prepare the data for insertion with correct timezone handling
  const checkInTime = parseBangladeshTime(parsed.check_in_time);
  if (!checkInTime) {
    return NextResponse.json({ error: "check_in_time is required and must be a valid date-time string." }, { status: 400 });
  }
  const formattedData = {
    ...parsed,
    check_in_time: checkInTime,
    check_out_time: parsed.check_out_time ? parseBangladeshTime(parsed.check_out_time) : null,
  };

  //const [rec] = await db.insert(attendance_logs).values(formattedData).returning();
  const [rec] = await db.insert(attendance_logs).values(formattedData).returning();
  return NextResponse.json(rec, { status: 201 });
}