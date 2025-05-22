// app/api/departments/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { departments } from '@/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const deptUpdateSchema = z.object({
  department: z.string().min(1).optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Extract and verify Bearer token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await authenticate(req); // Authenticate the user
  await authorize(user, 'view:departments'); // Check permissions

  const [rec] = await db.select().from(departments).where(eq(departments.id, Number(params.id)));
  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rec);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // Extract and verify Bearer token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await authenticate(req); // Authenticate the user
  await authorize(user, 'update:departments'); // Check permissions

  const parsed = deptUpdateSchema.parse(await req.json());
  const [updated] = await db
    .update(departments)
    .set(parsed)
    .where(eq(departments.id, Number(params.id)))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  // Extract and verify Bearer token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await authenticate(req); // Authenticate the user
  await authorize(user, 'delete:departments'); // Check permissions

  await db.delete(departments).where(eq(departments.id, Number(params.id)));
  return NextResponse.json({ success: true });
}
