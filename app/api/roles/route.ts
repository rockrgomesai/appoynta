// app/api/roles/route.ts
import { sql, asc, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roles } from '@/db/schema';
import jwt from 'jsonwebtoken';

export async function GET(req: Request) {
  try {
    // Extract and verify the Bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10));
    const sortColumn = searchParams.get('sortColumn') || 'id'; // Default to 'id'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // Default to 'desc'

    // Validate sortColumn to prevent SQL injection
    const allowedColumns = ['id', 'name'];
    const column = allowedColumns.includes(sortColumn) ? sortColumn : 'id';

    // Build the query filter
    const whereCond = search
      ? sql`${roles.name} ILIKE ${`%${search}%`}`
      : sql`TRUE`;

    // Build order by clause - ensure we're using the roles table columns
    let orderBy;
    if (column === 'id') {
      orderBy = sortOrder === 'asc' ? asc(roles.id) : desc(roles.id);
    } else {
      orderBy = sortOrder === 'asc' ? asc(roles.name) : desc(roles.name);
    }

    // Fetch data and total count in parallel
    const [data, total] = await Promise.all([
      db.select({ id: roles.id, name: roles.name })
        .from(roles)
        .where(whereCond)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql`COUNT(${roles.id})` })
        .from(roles)
        .where(whereCond)
        .then((result) => Number(result[0]?.count || 0)),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Extract and verify the Bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, process.env.JWT_SECRET!); // Verify the token
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse the request body
    const { name } = await req.json();

    // Insert the new role into the database
    const [record] = await db.insert(roles).values({ name }).returning();
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}