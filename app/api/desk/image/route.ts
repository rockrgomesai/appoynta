import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const visitorId = formData.get('visitorId');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create a unique filename
    const fileName = `visitor_${visitorId}_${Date.now()}${path.extname(file.name)}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/images directory
    const filePath = path.join(process.cwd(), 'public', 'images', fileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({ 
      success: true,
      imagePath: `/${fileName}`
    });
  } catch (error) {
    console.error('Error saving image:', error);
    return NextResponse.json(
      { error: 'Failed to save image' },
      { status: 500 }
    );
  }
}