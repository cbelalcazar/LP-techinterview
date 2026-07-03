/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/products/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Products API Route Handlers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET returns products list', async () => {
    const mockProducts = [
      { id: '1', name: 'Shoes', sku: 'S1', description: 'Desc', category: 'Cat', price: 99.9, stock: 10, weight_kg: 0.5 }
    ];
    (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
    (prisma.product.count as jest.Mock).mockResolvedValue(1);

    const req = new NextRequest('http://localhost:3000/api/products');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.products).toEqual(mockProducts);
    expect(data.pagination.total).toBe(1);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
  });

  it('GET filters products with search query', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/products?search=shoes');
    await GET(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'shoes', mode: 'insensitive' } },
          { description: { contains: 'shoes', mode: 'insensitive' } },
          { sku: { contains: 'shoes', mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20
    });
  });

  it('GET handles database failures', async () => {
    (prisma.product.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/products');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch products' });
  });

  it('POST creates a new product', async () => {
    const productData = { name: 'New', sku: 'N1', description: 'New product', category: 'Cat', price: 50.0, stock: 5, weight_kg: 1.2 };
    (prisma.product.create as jest.Mock).mockResolvedValue({ id: '2', ...productData });

    const req = new NextRequest('http://localhost:3000/api/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toEqual({ id: '2', ...productData });
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: {
        name: 'New',
        sku: 'N1',
        description: 'New product',
        category: 'Cat',
        price: 50.0,
        stock: 5,
        weight_kg: 1.2
      }
    });
  });

  it('POST handles creation failures', async () => {
    (prisma.product.create as jest.Mock).mockRejectedValue(new Error('Creation Error'));

    const req = new NextRequest('http://localhost:3000/api/products', {
      method: 'POST',
      body: JSON.stringify({})
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to create product' });
  });
});
