// app/api/visitors/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticate } from "@/lib/auth";
import { authorize } from "@/lib/permissions";
import { visitors } from "@/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  await authorize(user, "view:visitors");

  const [rec] = await db
    .select()
    .from(visitors)
    .where(eq(visitors.id, Number(params.id)));
  if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rec);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  await authorize(user, "update:visitors");

  // Define the schema for validation
  const updateVisitorSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    email: z
      .union([
        z.literal("").nullable(), // allow empty
        z.string().email("Invalid email"),
      ])
      .nullable()
      .optional(),
    phone: z.string().min(11, "Phone is required").optional(),
    whatsapp: z.enum(["Yes", "No"]).default("No").optional(),
    gender: z.enum(["Male", "Female", "Other"]).optional(),
    company: z.string().optional(),
    nid:      z.union([z.string().max(255), z.literal(''), z.null()]).optional(), // allow empty/null
    image_pp: z.string().optional(),
    note: z.string().optional(),
    status: z.enum(["Active", "Inactive"]).default("Active").optional(),
  });

  const { id } = await params;

  // Parse and validate the request body
  const parsed = updateVisitorSchema.parse(await req.json());

  // After parsing:
  if ("nid" in parsed) {
    if (parsed.nid === "" || parsed.nid === null) {
      parsed.nid = null;
    }
  }
  // Filter out null or undefined values
  const filteredParsed = Object.fromEntries(
    Object.entries(parsed).filter(
      ([_, value]) => value !== undefined
    )
  );

  // Update the visitor record in the database
  const [updated] = await db
    .update(visitors)
    .set(filteredParsed)
    .where(eq(visitors.id, Number(id)))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Visitor not found or update failed" },
      { status: 404 }
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  await authorize(user, "delete:visitors");
  await db.delete(visitors).where(eq(visitors.id, Number(params.id)));
  return NextResponse.json({ success: true });
}
