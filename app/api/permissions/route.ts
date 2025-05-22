// app/api/permissions/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { permissions } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const user = await authenticate(req);
  await authorize(user, 'view:permissions');

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');

  const where = search ? sql`name LIKE ${'%' + search + '%'}` : undefined;
  const [data, total] = await Promise.all([
    db.select().from(permissions).where(where || sql`TRUE`).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql`COUNT(id)` }).from(permissions).where(where).then(r => Number(r[0].count)),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await authenticate(req);
  await authorize(user, 'create:permissions');

  const { name } = await req.json();
  const [record] = await db.insert(permissions).values({ name }).returning();
  return NextResponse.json(record, { status: 201 });
}