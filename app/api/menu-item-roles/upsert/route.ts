import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { menuItemRoles } from "@/db/schema";
import { eq, and, not, inArray } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { getPermissionsForRole } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  const permissions = user ? await getPermissionsForRole(user.role_id) : [];
  // Uncomment for production:
  // if (!user || !permissions.includes("menu:permission:edit")) {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }
  try {
    const { role_id, menu_item_ids } = await req.json();
    if (!role_id || !Array.isArray(menu_item_ids)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Remove menu_item_roles not in the new list
    if (menu_item_ids.length > 0) {
      await db.delete(menuItemRoles)
        .where(
          and(
            eq(menuItemRoles.role_id, role_id),
            not(inArray(menuItemRoles.menuItemId, menu_item_ids))
          )
        );
    } else {
      await db.delete(menuItemRoles)
        .where(eq(menuItemRoles.role_id, role_id));
    }

    // Upsert new/remaining permissions
    if (menu_item_ids.length > 0) {
      await db.insert(menuItemRoles)
        .values(
          menu_item_ids.map((menuItemId: number) => ({
            menuItemId,
            role_id,
          }))
        )
        .onConflictDoNothing();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}