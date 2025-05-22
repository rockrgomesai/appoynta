import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { appointments, appointment_guest, attendance_logs, visitors } from '@/db/schema';

// GET /api/reports/appointments/guest-attendance?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
export async function GET(req: Request) {
  // Validate query params
  const { searchParams } = new URL(req.url);
  const from_date = searchParams.get('from_date');
  const to_date = searchParams.get('to_date');

  const dateSchema = z.object({
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  });
  try {
    dateSchema.parse({ from_date, to_date });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid or missing from_date/to_date. Use YYYY-MM-DD.' }, { status: 400 });
  }

  // Query: guests who attended, with visitor name, appointment topic, and type
  // Join: appointment_guest -> attendance_logs (on visitor_id), visitors (on visitor_id), appointments (on appointment_id)
  const results = await db
    .select({
      visitor_name: visitors.name,
      appointment_type: appointments.appointment_type,
      appointment_topic: appointments.topic,
      check_in_time: attendance_logs.check_in_time,
      badge_id: attendance_logs.badge_id
      
    })
    .from(attendance_logs)
    .innerJoin(appointment_guest, sql`${appointment_guest.appointment_id} = ${attendance_logs.appointment_id} AND ${appointment_guest.visitor_id} = ${attendance_logs.visitor_id}`)
    .innerJoin(visitors, sql`${visitors.id} = ${attendance_logs.visitor_id}`)
    .innerJoin(appointments, sql`${appointments.id} = ${attendance_logs.appointment_id}`)
    .where(sql`${attendance_logs.check_in_time} >= ${from_date} AND ${attendance_logs.check_in_time} <= ${to_date}`)
    .orderBy(sql`${attendance_logs.check_in_time} DESC`);

  return NextResponse.json({ data: results });
}
