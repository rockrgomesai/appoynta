import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { menuItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Zod schema for updating a menu item
const updateMenuItemSchema = z.object({
  label: z.string().min(1, "Label is required").optional(),
  href: z.string().url("Invalid URL").optional(),
  permission: z.string().min(1, "Permission is required").optional(),
  role: z.string().min(1, "Role is required").optional(),
  order: z.number().int().min(1, "Order must be a positive integer").optional(),
});

// GET: Fetch a specific menu item by ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    return NextResponse.json({ error: "Failed to fetch menu item" }, { status: 500 });
  }
}

// PATCH: Update a specific menu item by ID
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const data = updateMenuItemSchema.parse(body);

    const [updatedMenuItem] = await db
      .update(menuItems)
      .set(data)
      .where(eq(menuItems.id, id))
      .returning();

    if (!updatedMenuItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMenuItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating menu item:", error);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

// DELETE: Delete a specific menu item by ID
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const deleted = await db.delete(menuItems).where(eq(menuItems.id, id));
    if (!deleted) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}