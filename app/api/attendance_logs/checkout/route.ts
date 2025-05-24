import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance_logs } from "@/db/schema";
import { desc, eq, isNull, and } from "drizzle-orm";
import { z } from "zod";
import { authenticate } from "@/lib/auth";

// Schema for validating request body
const checkoutSchema = z.object({
  badge_id: z.string().min(1),
  check_out_time: z.string()
});

export async function PATCH(req: Request) {
  try {
    // Authenticate the request
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate request body
    const parsed = checkoutSchema.parse(await req.json());
    const { badge_id, check_out_time } = parsed;

    // Find the latest check-in record for this badge that hasn't been checked out
    const [record] = await db
      .select()
      .from(attendance_logs)
      .where(
        and(
          eq(attendance_logs.badge_id, badge_id),
          isNull(attendance_logs.check_out_time)
        )
      )
      .orderBy(desc(attendance_logs.check_in_time))
      .limit(1);

    if (!record) {
      return NextResponse.json(
        { error: "No active check-in found for this badge" },
        { status: 404 }
      );
    }

    // Update the record with check-out time
    const [updated] = await db
      .update(attendance_logs)
      .set({
        check_out_time: new Date(check_out_time)
      })
      .where(eq(attendance_logs.id, record.id))
      .returning();

    return NextResponse.json(updated);

  } catch (error) {
    console.error("Checkout error:", error);
    
    // Handle authentication errors specifically
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to process checkout",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}