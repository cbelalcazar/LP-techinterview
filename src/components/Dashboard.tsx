'use client';

import { useState, useEffect, useRef } from 'react';
import { Package, Search, Plus, Upload, Trash2, Edit, ShoppingCart, Loader2, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, Box, X } from 'lucide-react';
import { useProductStore } from '@/store/useProductStore';
import toast, { Toaster } from 'react-hot-toast';
import { useDebouncedCallback } from 'use-debounce';

export default function Dashboard() {
  const { products, stats, search, setSearch, category, setCategory, minPrice, setMinPrice, maxPrice, setMaxPrice, sortBy, setSortBy, loading, fetchProducts, deleteProduct, updateProductLocal, page, totalPages, setPage } = useProductStore();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<any[]>([]);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [localSearch, setLocalSearch] = useState(search);
  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', category: '', price: 0, stock: 0, weight_kg: 0
  });

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const debouncedSetSearch = useDebouncedCallback((val) => {
    setSearch(val);
  }, 400);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  const clearSearch = () => {
    setLocalSearch('');
    debouncedSetSearch('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append('file', file);

    const toastId = toast.loading('Uploading CSV...');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Success! Imported ${data.count} products.`, { id: toastId });
        if (data.errors && data.errors.length > 0) {
          setUploadErrors(data.errors);
        }
        fetchProducts();
      } else {
        toast.error(data.error || 'Upload failed', { id: toastId });
      }
    } catch (err) {
      toast.error('An error occurred during upload', { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
      toast.success('Product deleted');
    }
  };

  const handlePurchase = async (product: any) => {
    toast.success(`Payment processing for ${product.name}...`, { icon: '💳' });
    
    if (product.stock > 0) {
      try {
        const res = await fetch(`/api/products/${product.id}/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: 1 })
        });
        
        if (res.ok) {
          const updatedProduct = await res.json();
          updateProductLocal(product.id, { stock: updatedProduct.stock });
          toast.success(`Successfully purchased ${product.name}!`);
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || 'Failed to complete purchase');
        }
      } catch (err) {
        toast.error('Failed to complete purchase');
      }
    } else {
      toast.error('Out of stock!');
    }
  };

  const openModal = (product?: any) => {
    if (product) {
      setCurrentProduct(product);
      setFormData(product);
    } else {
      setCurrentProduct(null);
      setFormData({ name: '', sku: '', description: '', category: '', price: 0, stock: 0, weight_kg: 0 });
    }
    setIsModalOpen(true);
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = currentProduct ? `/api/products/${currentProduct.id}` : '/api/products';
    const method = currentProduct ? 'PUT' : 'POST';

    const toastId = toast.loading('Saving product...');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success('Product saved successfully', { id: toastId });
        setIsModalOpen(false);
        fetchProducts();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to save product', { id: toastId });
    }
  };

  return (
    <div className="container">
      <Toaster position="top-right" />
      <header className="header">
        <div className="logo">
          <Package size={28} />
          <h1>Nexus E-Commerce</h1>
        </div>
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={localSearch}
            onChange={handleSearch}
          />
          {localSearch && (
            <button className="clear-search" onClick={clearSearch} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="actions">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="btn btn-secondary">
            {uploading ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
            <span>Import CSV</span>
          </label>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>
      </header>
      
      <div className="filters-bar" style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Clothing">Clothing</option>
          <option value="Home">Home</option>
        </select>
        <input type="number" placeholder="Min Price" value={minPrice} onChange={e => setMinPrice(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', width: '100px' }} />
        <input type="number" placeholder="Max Price" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', width: '100px' }} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="newest">Newest Arrivals</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <main className="content">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon"><Box size={24} /></div>
            <div className="stat-info">
              <h3>Total Products</h3>
              <p>{stats?.totalProducts || 0}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><AlertTriangle size={24} /></div>
            <div className="stat-info">
              <h3>Out of Stock</h3>
              <p>{stats?.outOfStock || 0}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success"><TrendingUp size={24} /></div>
            <div className="stat-info">
              <h3>Total Inventory Value</h3>
              <p>${(stats?.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="grid">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card skeleton">
                <div className="skeleton-img"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text small"></div>
              </div>
            ))
          ) : products.length > 0 ? (
            products.map((product: any) => (
              <div key={product.id} className="card">
                <div className="card-header">
                  <span className="category-badge">{product.category || 'General'}</span>
                  <div className="card-actions">
                    <button className="icon-btn edit" onClick={() => openModal(product)}>
                      <Edit size={16} />
                    </button>
                    <button className="icon-btn delete" onClick={() => handleDelete(product.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 className="product-name">{product.name}</h3>
                <p className="product-sku">SKU: {product.sku}</p>
                <p className="product-desc">{product.description || 'No description available.'}</p>
                
                <div className="card-footer">
                  <div className="price-stock">
                    <span className="price">${product.price.toFixed(2)}</span>
                    <span className={`stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  <button 
                    className="btn btn-buy" 
                    disabled={product.stock <= 0}
                    onClick={() => handlePurchase(product)}
                  >
                    <ShoppingCart size={16} />
                    Buy
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Package size={48} />
              <h2>No products found</h2>
              <p>Try adjusting your search or add a new product.</p>
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="pagination">
            <button 
              className="btn-page" 
              disabled={page <= 1} 
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button 
              className="btn-page" 
              disabled={page >= totalPages} 
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{currentProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={saveProduct}>
              <div className="form-group">
                <label>Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} disabled={!!currentProduct} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price ($)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" step="0.01" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {uploadErrors.length > 0 && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <h2>Import Errors</h2>
            <p>Some rows failed to import. Please fix them and re-upload.</p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'var(--bg)', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
              {uploadErrors.map((err, i) => (
                <div key={i} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <p><strong>Row {err.row}:</strong> {typeof err.error === 'string' ? err.error : JSON.stringify(err.error)}</p>
                  <pre style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{JSON.stringify(err.data, null, 2)}</pre>
                </div>
              ))}
            </div>
            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setUploadErrors([])}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
