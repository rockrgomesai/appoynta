// app/api/users/route.ts
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { users, roles, departments, designations } from '@/db/schema';
import { hashPassword } from '@/lib/security';
import { z, ZodError } from 'zod';

const createUserSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1).optional(),
  username:  z.string().min(3),
  password:  z.string().min(8),
  department_id: z.number().int(),
  designation_id: z.number().int(),
  email:     z.string().email().optional(),
  telephone: z.string().min(11),
  role_id:    z.number().int(),
  status:    z.enum(['Active','Inactive']).default('Active'),
  role_name: z.string().optional(), // Optional for new users
});

export async function GET(req: Request) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    await authorize(user, 'view:users');

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10));

    // --- Sorting support ---
    const allowedSortColumns: Record<string, any> = {
      id: users.id,
      first_name: users.first_name,
      last_name: users.last_name,
      username: users.username,
      email: users.email,
      telephone: users.telephone,
      status: users.status,
      role_id: roles.id,
      role_name: roles.name,
      department: departments.department,
      designation: designations.designation,
    };
    // Default to id DESC so new records show on top
    const sortColumn = searchParams.get('sortColumn') || 'id';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const sortExpr = allowedSortColumns[sortColumn] || users.id;

    // Build the query filter
    const whereCond = sql`${users.status} = 'Active' AND (${
      search
        ? sql`${users.first_name} ILIKE ${`%${search}%`} OR ${users.last_name} ILIKE ${`%${search}%`} OR ${departments.department} ILIKE ${`%${search}%`} OR ${designations.designation} ILIKE ${`%${search}%`}`
        : sql`TRUE`
    })`;

    // Fetch data and total count in parallel
    const [data, total] = await Promise.all([
      db
        .select({
          id: users.id,
          first_name: users.first_name,
          last_name: users.last_name,
          username: users.username,
          email: users.email,
          telephone: users.telephone,
          status: users.status,
          role_id: roles.id,
          role_name: roles.name,
          department_id: departments.id,
          department: departments.department,
          designation_id: designations.id,
          designation: designations.designation,
        })
        .from(users)
        .leftJoin(roles, sql`${users.role_id} = ${roles.id}`)
        .leftJoin(departments, sql`${users.department_id} = ${departments.id}`)
        .leftJoin(designations, sql`${users.designation_id} = ${designations.id}`)
        .where(whereCond)
        .orderBy(sortOrder === 'asc' ? sql`${sortExpr} ASC` : sql`${sortExpr} DESC`)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql`COUNT(${users.id})` })
        .from(users)
        .leftJoin(departments, sql`${users.department_id} = ${departments.id}`)
        .leftJoin(designations, sql`${users.designation_id} = ${designations.id}`)
        .where(whereCond)
        .then((result) => Number(result[0]?.count || 0)),
    ]);

    // Return the response
    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await authenticate(req);
  await authorize(user, 'create:users');

  try {
    // Parse and validate the request body
    const parsed = createUserSchema.parse(await req.json());

    // Ensure all required fields are present
    const hashed = await hashPassword(parsed.password);

    const [newUser] = await db.insert(users)
      .values({
        first_name: parsed.first_name || '', // Match the database schema field name
        last_name: parsed.last_name || '',
        username: parsed.username || '',
        email: parsed.email || '',
        telephone: parsed.telephone || '', // Use empty string for optional fields
        password: hashed,
        role_id: parsed.role_id || 0, // Use a default value for role_id
        department_id: parsed.department_id || 0, // Include department_id
        designation_id: parsed.designation_id || 0, // Include designation_id
        status: parsed.status || 'Active', // Default status if not provided
      })
      .returning();

    // Exclude sensitive fields like password from the response
    const { password, ...rest } = newUser;

    return NextResponse.json(rest, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}