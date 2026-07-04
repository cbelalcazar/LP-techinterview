/**
 * @jest-environment node
 */
import { POST } from '@/app/api/products/[id]/purchase/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => {
      return callback(prisma);
    }),
  },
}));

describe('Purchase API Route Handlers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST purchases a product successfully', async () => {
    const mockProduct = { id: '1', name: 'Shoes', price: 100, stock: 5 };
    const updatedProduct = { ...mockProduct, stock: 4 };

    (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
    (prisma.product.update as jest.Mock).mockResolvedValue(updatedProduct);

    const req = new NextRequest('http://localhost:3000/api/products/1/purchase', {
      method: 'POST',
      body: JSON.stringify({ quantity: 1 })
    });
    const res = await POST(req, { params: Promise.resolve({ id: '1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(updatedProduct);
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: {
        productId: '1',
        quantity: 1,
        price: 100
      }
    });
  });

  it('POST returns 400 when out of stock', async () => {
    const mockProduct = { id: '1', name: 'Shoes', price: 100, stock: 0 };
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

    const req = new NextRequest('http://localhost:3000/api/products/1/purchase', {
      method: 'POST',
      body: JSON.stringify({ quantity: 1 })
    });
    const res = await POST(req, { params: Promise.resolve({ id: '1' }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Insufficient stock');
  });

  it('POST returns 404 when product not found', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/products/999/purchase', {
      method: 'POST',
      body: JSON.stringify({ quantity: 1 })
    });
    const res = await POST(req, { params: Promise.resolve({ id: '999' }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Not found');
  });

  it('POST returns 500 on database failure', async () => {
    (prisma.product.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/products/1/purchase', {
      method: 'POST',
      body: JSON.stringify({ quantity: 1 })
    });
    const res = await POST(req, { params: Promise.resolve({ id: '1' }) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to process purchase');
  });
});
