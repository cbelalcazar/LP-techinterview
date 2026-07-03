/**
 * @jest-environment node
 */
import { POST } from '@/app/api/upload/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      upsert: jest.fn(),
    },
  },
}));

describe('Upload API Route Handlers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST handles CSV files and upserts products', async () => {
    const csvContent = 'name,sku,description,category,price,stock,weight_kg\nTest Shoes,TS-001,Testing description,Footwear,$99.99,10,0.5\nYoga Block,YB-002,,Sports,free,50,0.3';
    
    (prisma.product.upsert as jest.Mock).mockResolvedValue({});

    const formData = new FormData();
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    formData.append('file', file);

    const req = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true, count: 2 });
    
    expect(prisma.product.upsert).toHaveBeenNthCalledWith(1, {
      where: { sku: 'TS-001' },
      update: { sku: 'TS-001', name: 'Test Shoes', description: 'Testing description', category: 'Footwear', price: 99.99, stock: 10, weight_kg: 0.5 },
      create: { sku: 'TS-001', name: 'Test Shoes', description: 'Testing description', category: 'Footwear', price: 99.99, stock: 10, weight_kg: 0.5 }
    });

    expect(prisma.product.upsert).toHaveBeenNthCalledWith(2, {
      where: { sku: 'YB-002' },
      update: { sku: 'YB-002', name: 'Yoga Block', description: '', category: 'Sports', price: 0, stock: 50, weight_kg: 0.3 },
      create: { sku: 'YB-002', name: 'Yoga Block', description: '', category: 'Sports', price: 0, stock: 50, weight_kg: 0.3 }
    });
  });

  it('POST handles partial upsert failures in loop', async () => {
    const csvContent = 'name,sku,description,category,price,stock,weight_kg\nFail Product,FAIL-123,,Misc,10,10,1';
    (prisma.product.upsert as jest.Mock).mockRejectedValueOnce(new Error('Upsert Error'));

    const formData = new FormData();
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    formData.append('file', file);

    const req = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true, count: 0 });
  });

  it('POST returns 400 if no file uploaded', async () => {
    const formData = new FormData();
    const req = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: 'No file uploaded' });
  });

  it('POST returns 500 on execution error', async () => {
    const req = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: 'invalid body'
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to process file' });
  });
});
