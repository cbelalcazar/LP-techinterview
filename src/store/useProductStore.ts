import { create } from 'zustand';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  weight_kg: number;
}

interface ProductStore {
  products: Product[];
  stats: { totalProducts: number; outOfStock: number; totalValue: number };
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  search: string;
  loading: boolean;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  fetchProducts: () => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProductLocal: (id: string, data: Partial<Product>) => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  stats: { totalProducts: 0, outOfStock: 0, totalValue: 0 },
  total: 0,
  page: 1,
  limit: 12,
  totalPages: 1,
  search: '',
  loading: false,

  setSearch: (search: string) => {
    set({ search, page: 1 });
    get().fetchProducts();
  },

  setPage: (page: number) => {
    set({ page });
    get().fetchProducts();
  },

  fetchProducts: async () => {
    set({ loading: true });
    try {
      const { search, page, limit } = get();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (search) params.append('search', search);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        set({ 
          products: data.products || data, 
          stats: data.stats || { totalProducts: 0, outOfStock: 0, totalValue: 0 },
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  deleteProduct: async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        get().fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  },

  updateProductLocal: (id: string, data: Partial<Product>) => {
    set((state) => ({
      products: state.products.map(p => p.id === id ? { ...p, ...data } : p)
    }));
  }
}));
