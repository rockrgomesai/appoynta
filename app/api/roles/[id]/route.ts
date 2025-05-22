// app/api/roles/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { roles } from '@/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

// Schema for role updates
const roleUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

// GET /api/roles/:id - Retrieve a role by ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'view:roles');

  const [role] = await db.select().from(roles).where(eq(roles.id, Number(params.id)));
  if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(role);
}

// PATCH /api/roles/:id - Update an existing role
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'update:roles');

  const updates = roleUpdateSchema.parse(await req.json());
  const [updated] = await db.update(roles)
    .set(updates)
    .where(eq(roles.id,Number(params.id)))
    .returning();
  return NextResponse.json(updated);
}

// DELETE /api/roles/:id - Remove a role
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'delete:roles');

  await db.delete(roles).where(eq(roles.id,Number(params.id)));
  return NextResponse.json({ success: true });
}