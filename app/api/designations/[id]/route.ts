// app/api/designations/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { designations } from '@/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const deptUpdateSchema = z.object({
    designation: z.string().min(1).optional(),
    status:     z.enum(['Active','Inactive']).optional(),
  });

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'view:designations');
  const [rec] = await db.select().from(designations).where(eq(designations.id, Number(params.id)));
  if (!rec) return NextResponse.json({ error:'Not found' }, { status:404 });
  return NextResponse.json(rec);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'update:designations');

  const parsed = deptUpdateSchema.parse(await req.json());
  const [updated] = await db.update(designations).set(parsed).where(eq(designations.id, Number(params.id))).returning();
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  await authorize(user, 'delete:designations');
  await db.delete(designations).where(eq(designations.id, Number(params.id)));
  return NextResponse.json({ success:true });
}
