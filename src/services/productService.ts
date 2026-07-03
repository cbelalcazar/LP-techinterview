import { productRepository } from '@/repositories/productRepository';
import { productSchema } from '@/schemas/product';
import { ParserFactory } from '@/parsers/parserFactory';

export class ProductService {
  async getProducts(search?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [products, total, stats] = await Promise.all([
      productRepository.findAll(search, skip, limit),
      productRepository.count(search),
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
    
    let count = 0;
    for (const row of records) {
      try {
        const validated = productSchema.parse(row);
        await productRepository.upsert(validated);
        count++;
      } catch (err) {
        console.error("Error validating/upserting product:", row, err);
      }
    }
    return count;
  }
}

export const productService = new ProductService();
