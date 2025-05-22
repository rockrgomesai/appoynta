// app/api/roles/route.ts
import { sql } from 'drizzle-orm';
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
      jwt.verify(token, process.env.JWT_SECRET!); // Verify the token
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10)); // Ensure page is at least 1
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)); // Ensure pageSize is at least 1

    // Build the query filter
    const whereCond = search
      ? sql`${roles.name} ILIKE ${`%${search}%`}` // Use ILIKE for case-insensitive search
      : sql`TRUE`; // Always true condition for no filter

    // Fetch data and total count in parallel
    const [data, total] = await Promise.all([
      db.select({ id: roles.id, name: roles.name }) // Select only id and name
        .from(roles)
        .where(whereCond)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql`COUNT(${roles.id})` })
        .from(roles)
        .where(whereCond)
        .then((result) => Number(result[0]?.count || 0)), // Handle cases where count might be undefined
    ]);

    // Return the response
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