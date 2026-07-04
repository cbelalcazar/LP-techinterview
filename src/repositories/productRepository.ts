import { prisma } from '@/lib/prisma';
import { ProductInput } from '@/schemas/product';

export class ProductRepository {
  async findAll(search?: string, skip?: number, take?: number, category?: string, minPrice?: number, maxPrice?: number, sortBy?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } }
      ];
    }
    if (category) {
      where.category = category;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (sortBy === 'newest') orderBy = { createdAt: 'desc' };
    
    return prisma.product.findMany({
      where,
      orderBy,
      skip,
      take
    });
  }

  async getStats() {
    const [totalProducts, outOfStock] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { stock: 0 } })
    ]);
    
    const valueResult = await prisma.$queryRaw<Array<{ totalValue: number }>>`
      SELECT COALESCE(SUM(price * stock), 0) as "totalValue"
      FROM "Product"
    `;

    return {
      totalProducts,
      outOfStock,
      totalValue: valueResult[0]?.totalValue || 0
    };
  }

  async count(search?: string, category?: string, minPrice?: number, maxPrice?: number) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } }
      ];
    }
    if (category) {
      where.category = category;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    return prisma.product.count({ where });
  }

  async findById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  }

  async create(data: ProductInput) {
    return prisma.product.create({ data });
  }

  async update(id: string, data: Partial<ProductInput>) {
    return prisma.product.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.product.delete({ where: { id } });
  }

  async upsert(data: ProductInput) {
    return prisma.product.upsert({
      where: { sku: data.sku },
      update: data,
      create: data
    });
  }
}

export const productRepository = new ProductRepository();
