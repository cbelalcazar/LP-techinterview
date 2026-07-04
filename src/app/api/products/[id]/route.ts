export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/productService';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const product = await productService.getProduct(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    logger.error({ err: error }, "GET by ID error");
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await request.json();
    const updated = await productService.updateProduct(params.id, body);
    return NextResponse.json(updated);
  } catch (error) {
    logger.error({ err: error }, "PUT error");
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await productService.deleteProduct(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({ err: error }, "DELETE error");
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
