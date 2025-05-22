// app/api/appointments/[id]/details/[detailId]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticate } from "@/lib/auth";
import { authorize } from "@/lib/permissions";
import { appointmentDetails } from "@/db/schema";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

// Reuse validation schema from parent module
const detailSchema = z
  .object({
    hostId: z.number().int().optional(),
    visitorId: z.number().int().optional(),
  })
  .refine((data) => (data.hostId != null) !== (data.visitorId != null), {
    message: "Either hostId or visitorId must be set, not both",
  });

// PATCH update a specific detail
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; detailId: string } }
) {
  const user = await authenticate(req);
  await authorize(user, "update:appointment_details");

  const appointment_id = Number(params.id);
  const detailId = Number(params.detailId);
  const parsed = detailSchema.parse(await req.json());

  const [updated] = await db
    .update(appointmentDetails)
    .set(parsed)
    .where(
      and(
        eq(appointmentDetails.appointment_id, appointment_id),
        eq(appointmentDetails.id, detailId)
      )
    )
    .returning();

  return NextResponse.json(updated);
}

// DELETE remove a specific detail
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; detailId: string } }
) {
  const user = await authenticate(req);
  await authorize(user, "delete:appointment_details");

  const appointment_id = Number(params.id);
  const detailId = Number(params.detailId);
  await db
    .delete(appointmentDetails)
    .where(
      and(
        eq(appointmentDetails.appointment_id, appointment_id),
        eq(appointmentDetails.id, detailId)
      )
    );

  return NextResponse.json({ success: true });
}
