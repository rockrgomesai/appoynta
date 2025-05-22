import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { appointment_guest, visitors, users } from '@/db/schema'; // Adjust the import path to your schema
import { z, ZodError } from 'zod';
import { sql, eq } from 'drizzle-orm';

// Zod schema for creating a guest appointment detail
const createGuestSchema = z.object({
  appointment_id: z.number().int().min(1, 'Appointment ID is required'),
  visitor_id: z.number().int().min(1, 'Visitor ID is required'),
});

// Zod schema for query parameters in GET
const getGuestsSchema = z.object({
  appointment_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).default('10'),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { appointment_id, page, pageSize } = getGuestsSchema.parse(queryParams);

    // Build the where condition dynamically
    const where: any[] = [];
    if (appointment_id) {
      where.push(eq(appointment_guest.appointment_id, appointment_id));
    }
    where.push(eq(visitors.status, 'Active')); // Add filter for active guests

    // Combine all conditions with AND
    const whereCondition = where.length > 0 ? sql.join(where, sql` AND `) : sql`TRUE`;

    // Query to fetch the required fields
    const data = await db
      .select({
        id: appointment_guest.id,
        appointment_id: appointment_guest.appointment_id,
        name: visitors.name,
        phone: visitors.phone,
        company: visitors.company,
      })
      .from(appointment_guest)
      .innerJoin(visitors, eq(appointment_guest.visitor_id, visitors.id)) // Join with visitors table
      .where(whereCondition)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Count total records for pagination
    const total = await db
      .select({ count: sql`COUNT(*)`.as<number>() })
      .from(appointment_guest)
      .innerJoin(visitors, eq(appointment_guest.visitor_id, visitors.id)) // Join with visitors table
      .where(whereCondition);

    return NextResponse.json({
      data,
      total: total[0]?.count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching appointment guests:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment guests' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Parse and validate the request body
    const parsed = createGuestSchema.parse(await req.json());

    // Insert the guest into the appointment_guest table
    const [insertedGuest] = await db
      .insert(appointment_guest)
      .values({
        appointment_id: parsed.appointment_id,
        visitor_id: parsed.visitor_id,
      })
      .returning({
        id: appointment_guest.id,
        appointment_id: appointment_guest.appointment_id,
        visitor_id: appointment_guest.visitor_id,
      });

      const [newGuest] = await db
      .select({
        id: appointment_guest.id,
        appointment_id: appointment_guest.appointment_id,
        visitor_id: appointment_guest.visitor_id,
        name: visitors.name,
        phone: visitors.phone,
        company: visitors.company,
      })
      .from(appointment_guest)
      .innerJoin(visitors, eq(appointment_guest.visitor_id, visitors.id)) // Join with visitors table
      .where(eq(appointment_guest.id, insertedGuest.id));


    // Return the inserted guest details
    return NextResponse.json(newGuest, { status: 201 });
  } catch (error) {
    console.error("Error adding guest:", error);

    // Handle validation errors from Zod
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    // Handle other errors
    return NextResponse.json({ error: "Failed to add guest" }, { status: 500 });
  }
}