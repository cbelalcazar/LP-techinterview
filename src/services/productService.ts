import { productRepository } from '@/repositories/productRepository';
import { productSchema } from '@/schemas/product';
import { ParserFactory } from '@/parsers/parserFactory';

import { prisma } from '@/lib/prisma';

export class ProductService {
  async getProducts(search?: string, page: number = 1, limit: number = 20, category?: string, minPrice?: number, maxPrice?: number, sortBy?: string) {
    const skip = (page - 1) * limit;
    const [products, total, stats] = await Promise.all([
      productRepository.findAll(search, skip, limit, category, minPrice, maxPrice, sortBy),
      productRepository.count(search, category, minPrice, maxPrice),
      productRepository.getStats()
    ]);
    return {
      products,
      stats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getProduct(id: string) {
    return productRepository.findById(id);
  }

  async createProduct(data: unknown) {
    const validated = productSchema.parse(data);
    return productRepository.create(validated);
  }

  async updateProduct(id: string, data: unknown) {
    const validated = productSchema.partial().parse(data);
    return productRepository.update(id, validated);
  }

  async deleteProduct(id: string) {
    return productRepository.delete(id);
  }

  async processFile(content: string, filename: string, mimetype: string | null) {
    const parser = ParserFactory.getParser(mimetype, filename);
    const records = parser.parse(content);
    
    const validRecords = [];
    const errors = [];
    
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const validated = productSchema.parse(row);
        validRecords.push(validated);
      } catch (err: any) {
        errors.push({ row: i + 2, data: row, error: err.errors || err.message }); // +2 for header and 1-index
      }
    }
    
    if (validRecords.length > 0) {
      // Chunking to avoid hitting query limits on huge files
      const chunkSize = 200;
      for (let i = 0; i < validRecords.length; i += chunkSize) {
        const chunk = validRecords.slice(i, i + chunkSize);
        await prisma.$transaction(
          chunk.map(data => prisma.product.upsert({
            where: { sku: data.sku },
            update: data,
            create: data
          }))
        );
      }
    }
    
    return { count: validRecords.length, errors };
  }

  async purchaseProduct(id: string, quantity: number = 1) {
    // Atomic decrement to prevent double-selling race conditions
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) throw new Error("Product not found");
      if (product.stock < quantity) throw new Error("Insufficient stock");

      const updated = await tx.product.update({
        where: { id },
        data: { stock: { decrement: quantity } }
      });

      await tx.transaction.create({
        data: {
          productId: id,
          quantity,
          price: product.price
        }
      });

      return updated;
    });
  }
}

export const productService = new ProductService();
