/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '@/app/api/products/[id]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Product ID API Route Handlers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET returns product if found', async () => {
    const mockProduct = { id: '1', name: 'Shoes', sku: 'S1', description: 'Desc', category: 'Cat', price: 99.9, stock: 10, weight_kg: 0.5 };
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

    const req = new NextRequest('http://localhost:3000/api/products/1');
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockProduct);
  });

  it('GET returns 404 if product not found', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/products/999');
    const res = await GET(req, { params: Promise.resolve({ id: '999' }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data).toEqual({ error: 'Not found' });
  });

  it('GET returns 500 on database failure', async () => {
    (prisma.product.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/products/1');
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) });

    expect(res.status).toBe(500);
  });

  it('PUT updates product correctly', async () => {
    const updatedData = { name: 'New Shoes', sku: 'S1-updated', description: 'Updated desc', category: 'Footwear', price: 120.0, stock: 8, weight_kg: 0.6 };
    (prisma.product.update as jest.Mock).mockResolvedValue({ id: '1', ...updatedData });

    const req = new NextRequest('http://localhost:3000/api/products/1', {
      method: 'PUT',
      body: JSON.stringify(updatedData)
    });
    const res = await PUT(req, { params: Promise.resolve({ id: '1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ id: '1', ...updatedData });
  });

  it('PUT returns 500 on update failure', async () => {
    (prisma.product.update as jest.Mock).mockRejectedValue(new Error('Update Error'));

    const req = new NextRequest('http://localhost:3000/api/products/1', {
      method: 'PUT',
      body: JSON.stringify({})
    });
    const res = await PUT(req, { params: Promise.resolve({ id: '1' }) });

    expect(res.status).toBe(500);
  });

  it('DELETE removes product and returns 204', async () => {
    (prisma.product.delete as jest.Mock).mockResolvedValue({});

    const req = new NextRequest('http://localhost:3000/api/products/1', {
      method: 'DELETE'
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) });

    expect(res.status).toBe(204);
    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('DELETE returns 500 on failure', async () => {
    (prisma.product.delete as jest.Mock).mockRejectedValue(new Error('Delete Error'));

    const req = new NextRequest('http://localhost:3000/api/products/1', {
      method: 'DELETE'
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) });

    expect(res.status).toBe(500);
  });
});
