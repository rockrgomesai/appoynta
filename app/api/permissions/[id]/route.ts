// app/api/permissions/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { permissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'view:permissions');
  const [perm] = await db.select().from(permissions).where(eq(permissions.id, Number(params.id)));
  if (!perm) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(perm);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'update:permissions');
  const { name } = await req.json();
  const [updated] = await db.update(permissions)
    .set({ name })
    .where(eq(permissions.id, Number(params.id)))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'delete:permissions');
  await db.delete(permissions).where(eq(permissions.id, Number(params.id)));
  return NextResponse.json({ success: true });
}