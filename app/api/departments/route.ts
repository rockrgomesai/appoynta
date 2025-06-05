// app/api/departments/route.ts
import { sql, asc, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { departments } from '@/db/schema';
import { z, ZodError } from 'zod';

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

    const user = await authenticate(req); // Authenticate the user
    await authorize(user, 'view:departments'); // Check permissions

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { search, status, page, pageSize, sortColumn, sortOrder } = getDepartmentsSchema.parse(queryParams);

    // Validate sortColumn to prevent SQL injection
    const allowedColumns = ['id', 'department', 'status'];
    const column = allowedColumns.includes(sortColumn) ? sortColumn : 'id';

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

    // Build order by clause
    let orderBy;
    if (column === 'id') {
      orderBy = sortOrder === 'asc' ? asc(departments.id) : desc(departments.id);
    } else if (column === 'department') {
      orderBy = sortOrder === 'asc' ? asc(departments.department) : desc(departments.department);
    } else if (column === 'status') {
      orderBy = sortOrder === 'asc' ? asc(departments.status) : desc(departments.status);
    } else {
      orderBy = desc(departments.id); // fallback
    }

    // Fetch data and total count in parallel
    const [data, total] = await Promise.all([
      db.select({ id: departments.id, department: departments.department, status: departments.status })
        .from(departments)
        .where(whereCondition)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql`COUNT(${departments.id})` })
        .from(departments)
        .where(whereCondition)
        .then((result) => Number(result[0]?.count || 0)),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Extract and verify Bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await authenticate(req); // Authenticate the user
    await authorize(user, 'create:departments'); // Check permissions

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