// app/api/appointments/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { appointments } from '@/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

// Zod schema for updating an appointment
const updateAppointmentSchema = z.object({
  topic: z.string().min(1, 'Topic is required').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)').optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)').optional(),
  appointment_type: z.enum(['Meeting', 'Project', 'Program', 'Demo', 'Delivery', 'Personal']).optional(),
  status: z.enum(['Active', 'Inactive']).default('Active').optional(),
  note: z.string().optional()
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'view:appointments');

  const { id } = await params;
  const [record] = await db.select().from(appointments).where(eq(appointments.id, Number(id)));
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(record);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'update:appointments');

  const { id } = await params;

  try {
    // Parse and validate the request body
    const parsed = updateAppointmentSchema.parse(await req.json());

    // Check if there are any fields to update
    if (Object.keys(parsed).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update only the provided fields
    const [updated] = await db.update(appointments)
      .set(parsed)
      .where(eq(appointments.id, Number(id)))
      .returning();

    console.log('Updated appointment:', updated);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'delete:appointments');

  const { id } = await params;

  const deleted = await db.delete(appointments).where(eq(appointments.id, Number(id)));
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}