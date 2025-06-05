// app/api/designations/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { designations } from '@/db/schema';
import { z, ZodError } from 'zod';
import { sql, asc, desc } from 'drizzle-orm';

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
  sortColumn: z.string().optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function GET(req: Request) {
  try {
    // Extract and verify Bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await authenticate(req);
    await authorize(user, 'view:designations');

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { search, status, page, pageSize, sortColumn, sortOrder } = getDesignationsSchema.parse(queryParams);

    // Validate sortColumn to prevent SQL injection
    const allowedColumns = ['id', 'designation', 'status'];
    const column = allowedColumns.includes(sortColumn) ? sortColumn : 'id';

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

    // Build order by clause
    let orderBy;
    if (column === 'id') {
      orderBy = sortOrder === 'asc' ? asc(designations.id) : desc(designations.id);
    } else if (column === 'designation') {
      orderBy = sortOrder === 'asc' ? asc(designations.designation) : desc(designations.designation);
    } else if (column === 'status') {
      orderBy = sortOrder === 'asc' ? asc(designations.status) : desc(designations.status);
    } else {
      orderBy = desc(designations.id); // fallback
    }

    // Fetch data and total count in parallel
    const [data, total] = await Promise.all([
      db.select({ id: designations.id, designation: designations.designation, status: designations.status })
        .from(designations)
        .where(whereCondition)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql`COUNT(${designations.id})` })
        .from(designations)
        .where(whereCondition)
        .then((result) => Number(result[0]?.count || 0)),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    console.error('Error fetching designations:', error);
    return NextResponse.json({ error: 'Failed to fetch designations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Extract and verify Bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await authenticate(req);
    await authorize(user, 'create:designations');

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