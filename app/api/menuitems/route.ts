import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { menuItems } from "@/db/schema";
import { z } from "zod";

// Zod schema for creating a menu item
const createMenuItemSchema = z.object({
  label: z.string().min(1, "Label is required"),
  href: z.string().url("Invalid URL").min(1, "Href is required"),
  permission: z.string().min(1, "Permission is required"),
  role: z.string().min(1, "Role is required"),
  order: z.number().int().min(1, "Order must be a positive integer"),
  menuicon: z.string().optional(),
});

// GET: Fetch all menu items
export async function GET() {
  try {
    const items = await db
      .select({
        id: menuItems.id,
        label: menuItems.label,
        href: menuItems.href,
        permission: menuItems.permission,
        order: menuItems.order,
        menuicon: menuItems.menuicon
      })
      .from(menuItems)
      .orderBy(menuItems.order);

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}

// POST: Create a new menu item
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createMenuItemSchema.parse(body);

    const [newMenuItem] = await db.insert(menuItems).values(data).returning();
    return NextResponse.json(newMenuItem, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating menu item:", error);
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}