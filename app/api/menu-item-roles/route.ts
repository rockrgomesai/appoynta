import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { menuItems, menuItemRoles } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/menu-item-roles
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roleId = Number(searchParams.get("role_id"));
  if (!roleId) {
    return NextResponse.json({ error: "Missing role_id" }, { status: 400 });
  }

  // Get all menu items and mark which are assigned to the role
  const data = await db
    .select({
      id: menuItems.id,
      label: menuItems.label,
      permission: menuItems.permission,
      selected: sql`CASE WHEN ${menuItemRoles.id} IS NOT NULL THEN true ELSE false END`.as("selected"),
    })
    .from(menuItems)
    .leftJoin(
      menuItemRoles,
      and(
        eq(menuItems.id, menuItemRoles.menuItemId),
        eq(menuItemRoles.role_id, roleId)
      )
    )
    .orderBy(menuItems.order);

  // After fetching the role's permissions
  const permissions = data.map(item => item.permission);
  const hasAllPermissions = permissions.includes("*") || permissions.includes("all");
  if (hasAllPermissions) {
    data.forEach(item => (item.selected = true));
  }

  return NextResponse.json({ data });
}

// POST /api/menu-item-roles/upsert
export async function POST(req: NextRequest) {
  try {
    const { role_id, menu_item_ids } = await req.json();
    if (!role_id || !Array.isArray(menu_item_ids)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Remove all current menu_item_roles for this role
    await db.delete(menuItemRoles).where(eq(menuItemRoles.role_id, role_id));

    // Insert new menu_item_roles
    if (menu_item_ids.length > 0) {
      await db.insert(menuItemRoles).values(
        menu_item_ids.map((menuItemId: number) => ({
          menuItemId,
          role_id,
        }))
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}