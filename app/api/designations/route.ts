// app/api/designations/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { designations } from '@/db/schema';
import { z, ZodError } from 'zod';
import { sql } from 'drizzle-orm';

// Zod schema for creating a designation
const createDesignationSchema = z.object({
  designation: z.string().min(1, 'Designation is required'),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

// Zod schema for query parameters in GET
const getDesignationsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).default('10'),
});

export async function GET(req: Request) {
  const user = await authenticate(req);
  await authorize(user, 'view:designations');

  // Parse and validate query parameters
  const { searchParams } = new URL(req.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  const { search, status, page, pageSize } = getDesignationsSchema.parse(queryParams);

  // Build the where condition dynamically
  const where: any[] = [];
  if (search) {
    where.push(sql`${designations.designation} ILIKE ${'%' + search + '%'}`);
  }
  if (status) {
    where.push(sql`${designations.status} = ${status}`);
  }

  // Combine all conditions with AND, or use TRUE if no conditions are provided
  const whereCondition = where.length > 0 ? sql.join(where, sql` AND `) : sql`TRUE`;

  const [data, total] = await Promise.all([
    db.select().from(designations).where(whereCondition).limit(pageSize).offset((page - 1) * pageSize),
    db
      .select({ count: sql`COUNT(${designations.id})` })
      .from(designations)
      .where(whereCondition)
      .then((r) => Number(r[0].count)),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await authenticate(req);
  await authorize(user, 'create:designations');

  try {
    // Parse and validate the request body
    const parsed = createDesignationSchema.parse(await req.json());

    const [newDesignation] = await db.insert(designations)
      .values({
        designation: parsed.designation,
        status: parsed.status,
      })
      .returning();

    return NextResponse.json(newDesignation, { status: 201 });
  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    // Handle duplicate key error (Postgres unique violation)
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: "Designation with this name already exists" }, { status: 409 });
    }
    console.error('Error creating designation:', error);
    return NextResponse.json({ error: 'Failed to create designation' }, { status: 500 });
  }
}