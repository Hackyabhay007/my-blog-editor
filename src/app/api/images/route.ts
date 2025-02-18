import { readdir } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    const files = await readdir(uploadsDir);
    
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => ({
        url: `/uploads/${file}`,
        filename: file
      }));

    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
