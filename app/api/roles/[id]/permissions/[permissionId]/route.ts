// app/api/roles/[id]/permissions/[permissionId]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { rolePermissions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// DELETE /api/roles/[id]/permissions/[permissionId]
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; permissionId: string } }
) {
  const user = await authenticate(req);
  await authorize(user, 'delete:role_permissions');

  const role_id = Number(params.id);
  const permissionId = Number(params.permissionId);

  await db.delete(rolePermissions)
    .where(and(
      eq(rolePermissions.role_id, role_id),
        (eq(rolePermissions.permissionId, permissionId))
    ));

  return NextResponse.json({ success: true });
}