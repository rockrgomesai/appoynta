// app/api/departments/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { departments } from '@/db/schema';
import { z, ZodError } from 'zod';
import { sql } from 'drizzle-orm';

// Zod schema for creating a department
const createDepartmentSchema = z.object({
  department: z.string().min(1, 'Department is required'),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

// Zod schema for query parameters in GET
const getDepartmentsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
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
  await authorize(user, 'view:departments'); // Check permissions

  // Parse and validate query parameters
  const { searchParams } = new URL(req.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  const { search, status, page, pageSize } = getDepartmentsSchema.parse(queryParams);

  // Build the where condition dynamically
  const where: any[] = [];
  if (search) {
    where.push(sql`${departments.department} ILIKE ${'%' + search + '%'}`);
  }
  if (status) {
    where.push(sql`${departments.status} = ${status}`);
  }

  // Combine all conditions with AND, or use TRUE if no conditions are provided
  const whereCondition = where.length > 0 ? sql.join(where, sql` AND `) : sql`TRUE`;

  const [data, total] = await Promise.all([
    db.select().from(departments).where(whereCondition).limit(pageSize).offset((page - 1) * pageSize),
    db
      .select({ count: sql`COUNT(${departments.id})` })
      .from(departments)
      .where(whereCondition)
      .then((r) => Number(r[0].count)),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  // Extract and verify Bearer token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await authenticate(req); // Authenticate the user
  await authorize(user, 'create:departments'); // Check permissions

  try {
    // Parse and validate the request body
    const parsed = createDepartmentSchema.parse(await req.json());

    const [newDepartment] = await db.insert(departments)
      .values({
        department: parsed.department,
        status: parsed.status,
      })
      .returning();

    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    // Handle duplicate key error (Postgres unique violation)
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: "Department with this name already exists" }, { status: 409 });
    }
    console.error('Error creating department:', error);
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}