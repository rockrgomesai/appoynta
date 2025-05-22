// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { users } from '@/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const updateUserSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  telephone: z.string().min(11).optional(),
  department_id: z.number().int().nullable().optional(), // Allow null
  designation_id: z.number().int().nullable().optional(), // Allow null
  role_id: z.number().int().nullable().optional(), // Allow null
  status: z.enum(['Active', 'Inactive']).optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Extract and verify Bearer token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await authenticate(req); // Authenticate the user
  await authorize(user, 'view:users'); // Check permissions

  const [record] = await db.select().from(users).where(eq(users.id, Number(params.id)));
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { password, ...rest } = record;
  return NextResponse.json(rest);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // Extract and verify Bearer token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await authenticate(req); // Authenticate the user
  await authorize(user, 'update:users'); // Check permissions

  const { id } = await params;
  const parsed = updateUserSchema.parse(await req.json());
  const filteredParsed = Object.fromEntries(
    Object.entries(parsed).filter(([_, value]) => value !== null)
  );
  const [updated] = await db
    .update(users)
    .set(filteredParsed)
    .where(eq(users.id, Number(id)))
    .returning();

  const { password, ...rest } = updated;
  return NextResponse.json(rest);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  // Extract and verify Bearer token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await authenticate(req); // Authenticate the user
  await authorize(user, 'delete:users'); // Check permissions

  await db.delete(users).where(eq(users.id, Number(params.id)));
  return NextResponse.json({ success: true });
}