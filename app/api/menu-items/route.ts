import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { menuItems } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getPermissionsForRole } from "@/lib/permissions";

// GET /api/menu-items
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  const permissions = user ? await getPermissionsForRole(user.role_id) : [];
  /*
  if (!user || !permissions.includes("menu:permission:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  */

  const data = await db
    .select({
      id: menuItems.id,
      label: menuItems.label,
      permission: menuItems.permission,
      order: menuItems.order,
    })
    .from(menuItems)
    .orderBy(menuItems.order);

  return NextResponse.json({ data });
}