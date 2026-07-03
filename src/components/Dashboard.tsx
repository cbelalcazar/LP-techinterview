'use client';

import { useState, useEffect, useRef } from 'react';
import { Package, Search, Plus, Upload, Trash2, Edit, ShoppingCart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProductStore } from '@/store/useProductStore';
import toast, { Toaster } from 'react-hot-toast';

export default function Dashboard() {
  const { products, search, setSearch, loading, fetchProducts, deleteProduct, updateProductLocal, page, totalPages, setPage } = useProductStore();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', category: '', price: 0, stock: 0, weight_kg: 0
  });

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
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
      const updatedProduct = { ...product, stock: product.stock - 1 };
      
      try {
        const res = await fetch(`/api/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct)
        });
        
        if (res.ok) {
          updateProductLocal(product.id, { stock: updatedProduct.stock });
          toast.success(`Successfully purchased ${product.name}!`);
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
            placeholder="Search by name, sku or description..." 
            value={search}
            onChange={handleSearch}
          />
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

      <main className="content">
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
    </div>
  );
}
