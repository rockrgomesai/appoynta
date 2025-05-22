import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { appointment_host, users, departments, designations } from '@/db/schema'; // Adjust the import path to your schema
import { z, ZodError } from 'zod';
import { sql, eq } from 'drizzle-orm';

// Zod schema for creating a host appointment detail
const createHostSchema = z.object({
  appointment_id: z.number().int().min(1, 'Appointment ID is required'),
  host_id: z.number().int().min(1, 'Host ID is required'),
  tag: z.string().optional(),
});

// Zod schema for query parameters in GET
const getHostsSchema = z.object({
  appointment_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).default('10'),
});

export async function GET(req: Request) {
  // Extract and verify Bearer token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await authenticate(req); // Authenticate the user
  await authorize(user, 'view:appointment_host'); // Check permissions

  // Parse and validate query parameters
  const { searchParams } = new URL(req.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  const { appointment_id, page, pageSize } = getHostsSchema.parse(queryParams);

  // Build the where condition dynamically
  const where: any[] = [];
  if (appointment_id) {
    where.push(eq(appointment_host.appointment_id, appointment_id));
  }

  // Combine all conditions with AND, or use TRUE if no conditions are provided
  const whereCondition = where.length > 0 ? sql.join(where, sql` AND `) : sql`TRUE`;

  try {
    // Query to fetch the required fields
    const data = await db
      .select({
        id: appointment_host.id,
        appointment_id: appointment_host.appointment_id,
        user_id: users.id,
        name: sql`${users.first_name} || ' ' || ${users.last_name}`.as('name'),
        department: departments.department,
        designation: designations.designation,
      })
      .from(appointment_host)
      .innerJoin(users, eq(appointment_host.host_id, users.id))
      .innerJoin(departments, eq(users.department_id, departments.id))
      .innerJoin(designations, eq(users.designation_id, designations.id))
      .where(whereCondition)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Count total records for pagination
    const total = await db
      .select({ count: sql`COUNT(*)`.as<number>() })
      .from(appointment_host)
      .where(whereCondition);

    return NextResponse.json({
      data,
      total: total[0]?.count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching appointment hosts:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment hosts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const parsed = createHostSchema.parse(await req.json());

    const [insertedHost] = await db
      .insert(appointment_host)
      .values({
        appointment_id: parsed.appointment_id,
        host_id: parsed.host_id,
      })
      .returning({
        id: appointment_host.id,
        appointment_id: appointment_host.appointment_id,
        host_id: appointment_host.host_id,
      });

    const [newHost] = await db
      .select({
        id: appointment_host.id,
        appointment_id: appointment_host.appointment_id,
        host_id: appointment_host.host_id,
        name: sql`${users.first_name} || ' ' || ${users.last_name}`.as('name'),
        department: departments.department,
        designation: designations.designation,
      })
      .from(appointment_host)
      .innerJoin(users, eq(appointment_host.host_id, users.id))
      .innerJoin(departments, eq(users.department_id, departments.id))
      .innerJoin(designations, eq(users.designation_id, designations.id))
      .where(eq(appointment_host.id, insertedHost.id));

    return NextResponse.json(newHost, { status: 201 });
  } catch (error) {
    console.error("Error adding host:", error);
    return NextResponse.json({ error: "Failed to add host" }, { status: 500 });
  }
}