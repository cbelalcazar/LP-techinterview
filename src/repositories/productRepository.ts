import { prisma } from '@/lib/prisma';
import { ProductInput } from '@/schemas/product';

export class ProductRepository {
  async findAll(search?: string, skip?: number, take?: number) {
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};
    
    return prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });
  }

  async count(search?: string) {
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};
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
