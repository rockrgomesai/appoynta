// app/api/attendance-logs/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { attendance_logs } from '@/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const logUpdateSchema = z.object({
    appointment_id: z.number().optional(),
    visitor_id:     z.number().optional(),
    badge_id:       z.string().min(1).optional(),
    check_in_time:   z.string().optional(),
    check_out_time:  z.string().optional(),
    note:          z.string().optional(),
  
  });

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'view:attendance_logs');

  const [rec] = await db.select().from(attendance_logs).where(eq(attendance_logs.id, Number(params.id)));
  if (!rec) return NextResponse.json({ error:'Not found' }, { status:404 });
  return NextResponse.json(rec);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'update:attendance_logs');

  const parsed = logUpdateSchema.parse(await req.json());
  const { check_in_time, check_out_time, ...rest } = parsed;

  // Function to parse time string and maintain Bangladesh time (UTC+6)
  const parseBangladeshTime = (timeString: string | undefined) => {
    if (!timeString) return undefined;
    
    // Split the date-time string
    const [datePart, timePart] = timeString.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes, seconds] = timePart.split(':');

    // Create date object with Bangladesh time (UTC+6)
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1, // months are 0-based
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );

    // Adjust for UTC storage by subtracting 6 hours from the local time
    return new Date(date.getTime() - (6 * 60 * 60 * 1000));
  };

  const updateData = {
    ...rest,
    checkInTime: parseBangladeshTime(check_in_time),
    checkOutTime: parseBangladeshTime(check_out_time),
  };

  const [updated] = await db
    .update(attendance_logs)
    .set(updateData)
    .where(eq(attendance_logs.id, Number(params.id)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'delete:attendance_logs');
  await db.delete(attendance_logs).where(eq(attendance_logs.id, Number(params.id)));
  return NextResponse.json({ success:true });
}