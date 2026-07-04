export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/productService';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await request.json().catch(() => ({}));
    const quantity = body.quantity || 1;
    
    const updated = await productService.purchaseProduct(params.id, quantity);
    return NextResponse.json(updated);
  } catch (error: any) {
    logger.error({ err: error }, "Purchase error");
    if (error.message === 'Product not found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (error.message === 'Insufficient stock') {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 });
  }
}
