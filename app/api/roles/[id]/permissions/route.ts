// app/api/roles/[id]/permissions/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { rolePermissions, permissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/roles/[id]/permissions
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  await authorize(user, 'view:role_permissions');

  const role_id = Number(params.id);
  const data = await db
    .select({ id: permissions.id, name: permissions.name })
    .from(rolePermissions)
    .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(rolePermissions.role_id, role_id));

  return NextResponse.json(data);
}

// POST /api/roles/[id]/permissions
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  await authorize(user, 'update:role_permissions');

  const role_id = Number(params.id);
  const { permissionIds } = await req.json();

  // Replace existing permissions
  await db.delete(rolePermissions).where(eq(rolePermissions.role_id, role_id));
  await Promise.all(
    permissionIds.map((pid: number) =>
      db.insert(rolePermissions).values({ role_id, permissionId: pid })
    )
  );

  return NextResponse.json({ success: true });
}