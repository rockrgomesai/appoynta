// app/api/menus/route.ts
import { db } from '@/lib/db'; // your drizzle client
import { menuItems, menuItemRoles } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role') || 'admin'; // fallback

  const items = await db
    .select({
      id: menuItems.id,
      label: menuItems.label,
      href: menuItems.href,
      icon: menuItems.menuicon,
      parentId: menuItems.parent_id,
      order: menuItems.order,
      isSubmenu: menuItems.is_submenu,
    })
    .from(menuItems)
    .leftJoin(menuItemRoles, eq(menuItems.id, menuItemRoles.menuItemId))
    .where(eq(menuItemRoles.role_id, Number(role)))
    .orderBy(asc(menuItems.order));

  // Build tree from flat structure
  const menuMap: Record<number, any> = {};
  const tree: any[] = [];

  for (const item of items) {
    // Ensure parent menus have a default href
    const href = item.isSubmenu ? item.href : (item.href || '#');
    menuMap[item.id] = { ...item, href, children: [] };
  }

  for (const item of items) {
    if (item.parentId) {
      menuMap[item.parentId]?.children.push(menuMap[item.id]);
    } else {
      tree.push(menuMap[item.id]);
    }
  }

  return NextResponse.json(tree);
}
