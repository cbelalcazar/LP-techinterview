export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/productService';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const category = searchParams.get('category') || undefined;
    const minPriceStr = searchParams.get('minPrice');
    const minPrice = minPriceStr ? parseFloat(minPriceStr) : undefined;
    const maxPriceStr = searchParams.get('maxPrice');
    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    
    const result = await productService.getProducts(search, page, limit, category, minPrice, maxPrice, sortBy);
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "GET error");
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = await productService.createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    logger.error({ err: error }, "POST error");
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
