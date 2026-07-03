export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/productService';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileContent = await file.text();
    const count = await productService.processFile(fileContent, file.name, file.type);
    
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
