import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { visitors } from "@/db/schema";
import { desc, isNotNull } from "drizzle-orm";

export async function GET() {
  try {
    // Fetch single visitor that has face descriptors
    const visitor = await db
      .select({
        id: visitors.id,
        name: visitors.name,
        phone: visitors.phone,
        email: visitors.email,
        image_pp: visitors.image_pp,
        face_descriptors: visitors.face_descriptors
      })
      .from(visitors)
      .where(isNotNull(visitors.face_descriptors))
      .orderBy(desc(visitors.id))
      .limit(1)
      .then(results => results[0]);

    // Always return an object with a visitors array, even if empty
    return NextResponse.json({
      success: true,
      visitors: visitor ? [visitor] : []
    });

  } catch (error) {
    console.error("Error fetching visitors:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch visitors",
      visitors: []
    }, { 
      status: 500 
    });
  }
}