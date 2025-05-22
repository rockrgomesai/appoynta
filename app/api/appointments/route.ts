// app/api/appointments/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { appointments } from '@/db/schema';
import { z, ZodError } from 'zod';
import { sql } from 'drizzle-orm';

// Zod schema for creating an appointment
const createAppointmentSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  appointment_type: z.enum(['Meeting', 'Project', 'Program', 'Demo', 'Delivery', 'Personal']),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  note: z.string().optional()
});

// Zod schema for query parameters in GET
const getAppointmentsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  appointment_type: z.enum(['Meeting', 'Project', 'Program', 'Demo', 'Delivery', 'Personal']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).default('10'),
});

export async function GET(req: Request) {
  const user = await authenticate(req);
  await authorize(user, 'view:appointments');

  // Parse and validate query parameters
  const { searchParams } = new URL(req.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  const { search, status, appointment_type, page, pageSize, sortColumn, sortOrder } = getAppointmentsSchema.extend({
    sortColumn: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }).parse(queryParams);

  // Build the where condition dynamically
  const where: any[] = [];
  if (search) {
    where.push(sql`${appointments.topic} ILIKE ${'%' + search + '%'} `);
  }
  if (status) {
    where.push(sql`${appointments.status} = ${status}`);
  }
  if (appointment_type) {
    where.push(sql`${appointments.appointment_type} = ${appointment_type}`);
  }

  // Combine all conditions with AND, or use TRUE if no conditions are provided
  const whereCondition = where.length > 0 ? sql.join(where, sql` AND `) : sql`TRUE`;

  // Always force descending order by id unless explicitly overridden
  const validColumns = ['appointment_type', 'topic', 'start_date', 'end_date', 'start_time', 'end_time', 'status'];
  const column = validColumns.includes(sortColumn || '') ? sortColumn : 'id';
  const order = sortOrder === 'asc' ? sql`ASC` : sql`DESC`;

  // Fetch data with sorting
  const [data, total] = await Promise.all([
    db.select()
      .from(appointments)
      .where(whereCondition)
      .orderBy(sql`${sql.identifier(column!)} ${order}`)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql`COUNT(${appointments.id})` })
      .from(appointments)
      .where(whereCondition)
      .then((r) => Number(r[0].count)),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await authenticate(req);
  await authorize(user, 'create:appointments');

  try {
    // Parse and validate the request body
    const parsed = createAppointmentSchema.parse(await req.json());

    const [newAppointment] = await db.insert(appointments)
      .values({
        topic: parsed.topic || '',
        start_date: parsed.start_date,
        end_date: parsed.end_date,
        start_time: parsed.start_time,
        end_time: parsed.end_time,
        appointment_type: parsed.appointment_type,
        status: parsed.status,
        note: parsed.note || ''
      })
      .returning();

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}