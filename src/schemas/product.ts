import { z } from 'zod';

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  category: z.string().optional().default(''),
  price: z.preprocess((val) => {
    if (typeof val === 'string') {
      if (val.toLowerCase() === 'free') return 0;
      return parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
    }
    return Number(val) || 0;
  }, z.number().min(0)),
  stock: z.preprocess((val) => Number(val) || 0, z.number().min(0)),
  weight_kg: z.preprocess((val) => Number(val) || 0, z.number().min(0))
});

export type ProductInput = z.infer<typeof productSchema>;
