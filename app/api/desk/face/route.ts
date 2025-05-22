import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { visitors } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const descriptor = formData.get('descriptor');
    const imageFile = formData.get('image') as File;
    const visitorId = formData.get('visitorId') as string;

    if (!descriptor || !imageFile || !visitorId) {
      return NextResponse.json(
        { success: false, message: "Missing data" },
        { status: 400 }
      );
    }

    // Parse descriptor
    const descriptorArray = JSON.parse(descriptor as string);

    // Save descriptor to DB
    await db
      .update(visitors)
      .set({ face_descriptors: descriptorArray })
      .where(eq(visitors.id, parseInt(visitorId)));

    // (Optional) Save image file as before...

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to save face data", error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}

// The following client-side example code should be placed in your frontend, not in the API route file.
// Remove or move this block to avoid "Cannot find name 'detection'" and other client-side errors.