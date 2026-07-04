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
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (args) => {
      if (Array.isArray(args)) {
        return Promise.all(args);
      }
      return args(prisma);
    }),
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
    expect(data).toEqual({ success: true, count: 2, errors: [] });
    
    expect(data.errors.length).toBe(0);
    
    expect(prisma.product.upsert).toHaveBeenCalledWith({
      where: { sku: 'TS-001' },
      update: expect.any(Object),
      create: expect.any(Object)
    });

    expect(prisma.product.upsert).toHaveBeenCalledWith({
      where: { sku: 'YB-002' },
      update: expect.any(Object),
      create: expect.any(Object)
    });
  });

  it('POST returns 200 and errors for invalid csv rows', async () => {
    // Missing required fields like name and sku
    const csvContent = 'name,sku,price,stock\n,,10,10';
    
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
    expect(data.success).toBe(true);
    expect(data.count).toBe(0);
    expect(data.errors.length).toBe(1);
    expect(data.errors[0].row).toBe(2);
  });

  it('POST returns 400 if no file uploaded', async () => {
    const req = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
    });
    req.formData = jest.fn().mockResolvedValue(new FormData());

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: 'No file uploaded' });
  });

  it('POST returns 500 on execution error', async () => {
    const req = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
    });
    
    req.formData = jest.fn().mockRejectedValue(new Error('Parse Error'));

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to process file' });
  });
});
