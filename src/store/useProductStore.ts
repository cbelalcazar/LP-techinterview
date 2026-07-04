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
  category: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  loading: boolean;
  setSearch: (search: string) => void;
  setCategory: (category: string) => void;
  setMinPrice: (minPrice: string) => void;
  setMaxPrice: (maxPrice: string) => void;
  setSortBy: (sortBy: string) => void;
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
  category: '',
  minPrice: '',
  maxPrice: '',
  sortBy: 'newest',
  loading: false,

  setSearch: (search: string) => {
    set({ search, page: 1 });
    get().fetchProducts();
  },
  
  setCategory: (category: string) => {
    set({ category, page: 1 });
    get().fetchProducts();
  },

  setMinPrice: (minPrice: string) => {
    set({ minPrice, page: 1 });
    get().fetchProducts();
  },

  setMaxPrice: (maxPrice: string) => {
    set({ maxPrice, page: 1 });
    get().fetchProducts();
  },

  setSortBy: (sortBy: string) => {
    set({ sortBy, page: 1 });
    get().fetchProducts();
  },

  setPage: (page: number) => {
    set({ page });
    get().fetchProducts();
  },

  fetchProducts: async () => {
    set({ loading: true });
    try {
      const { search, category, minPrice, maxPrice, sortBy, page, limit } = get();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sortBy) params.append('sortBy', sortBy);

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
