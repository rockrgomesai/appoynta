// app/api/appointments/[id]/details/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { appointments, users, visitors, appointmentDetails } from '@/db/schema';
import { z } from 'zod';
import { eq, isNotNull, and } from 'drizzle-orm';

// Validation schema for details
const detailSchema = z.object({
  hostId:    z.number().int().optional(),
  visitorId: z.number().int().optional(),
}).refine(data => (data.hostId != null) !== (data.visitorId != null), {
  message: 'Either hostId or visitorId must be set, not both',
});

// GET list of appointment details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  await authorize(user, 'view:appointment_details');

  const appointment_id = Number(params.id);
  if (isNaN(appointment_id)) {
    return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
  }

  // Fetch appointment details
  const appointment = await db
    .select({
      id: appointments.id,
      topic: appointments.topic,
      startDate: appointments.startDate,
      endDate: appointments.endDate,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      appointmentType: appointments.appointmentType,
      status: appointments.status,
      note: appointments.note,
    })
    .from(appointments)
    .where(eq(appointments.id, appointment_id))
    .then((rows) => rows[0]);

  if (!appointment) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  // Fetch all hosts for the appointment
  const hosts = await db
    .select({
      id: users.id,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
      telephone: users.telephone,
      role_id: users.role_id,
      status: users.status,
    })
    .from(appointmentDetails)
    .leftJoin(users, eq(appointmentDetails.hostId, users.id))
    .where(and(eq(appointmentDetails.appointment_id, appointment_id), isNotNull(appointmentDetails.hostId)));

  // Fetch all visitors for the appointment
  const visitorDetails = (await db
    .select({
      id: visitors.id,
      name: visitors.name,
      email: visitors.email,
      phone: visitors.phone,
      status: visitors.status,
    })
    .from(appointmentDetails)
    .leftJoin(visitors, eq(appointmentDetails.visitorId, visitors.id))
    .where(and(eq(appointmentDetails.appointment_id, appointment_id), isNotNull(appointmentDetails.visitorId))))
    .map(visitor => ({
      id: visitor.id ?? 0,
      name: visitor.name ?? '',
      email: visitor.email ?? '',
      phone: visitor.phone ?? '',
      status: visitor.status ?? 'Inactive',
    }));

  return NextResponse.json({
    appointment,
    hosts,
    visitorDetails,
  });
}

// POST create a new detail
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  await authorize(user, 'create:appointment_details');

  const appointment_id = Number(params.id);
  const parsed = detailSchema.parse(await req.json());
  const [rec] = await db.insert(appointmentDetails)
    .values({ appointment_id, ...parsed })
    .returning();

  return NextResponse.json(rec, { status: 201 });
}