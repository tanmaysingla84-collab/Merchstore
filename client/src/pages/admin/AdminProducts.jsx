import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Folder, 
  Coins, 
  Layers, 
  ChevronRight, 
  Loader2, 
  Filter 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProducts } from '../../features/products/productSlice';
import { createAdminProduct, updateAdminProduct, deleteAdminProduct } from '../../features/admin/adminSlice';
import ProductFormModal from '../../components/admin/ProductFormModal';

const AdminProducts = () => {
  const dispatch = useDispatch();
  
  // State from slices
  const { items: products, loading: productsLoading } = useSelector((state) => state.products);
  const { loading: adminLoading } = useSelector((state) => state.admin);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Initial Load
  useEffect(() => {
    loadProducts();
  }, [dispatch, categoryFilter]);

  const loadProducts = () => {
    dispatch(fetchProducts({ 
      includeInactive: 'true',
      limit: 100,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchProducts({ 
      includeInactive: 'true',
      limit: 100,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      search: searchTerm.trim() || undefined,
    }));
  };

  const handleOpenAddModal = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleSaveProduct = (formData) => {
    if (selectedProduct) {
      // Edit
      dispatch(updateAdminProduct({ id: selectedProduct._id, formData }))
        .unwrap()
        .then((res) => {
          toast.success(res.message || 'Product updated successfully!');
          setModalOpen(false);
          loadProducts();
        })
        .catch((err) => {
          toast.error(err || 'Failed to update product');
        });
    } else {
      // Add
      dispatch(createAdminProduct(formData))
        .unwrap()
        .then((res) => {
          toast.success(res.message || 'Product created successfully!');
          setModalOpen(false);
          loadProducts();
        })
        .catch((err) => {
          toast.error(err || 'Failed to create product');
        });
    }
  };

  const handleDeleteClick = (product) => {
    const isHard = window.confirm(
      `Manage deletion for "${product.name}":\n\n- Click OK to Deactivate / Soft Delete (hides from public catalog, can edit later).\n- Click Cancel to discard change.`
    );
    
    if (isHard) {
      // Soft delete by default
      dispatch(deleteAdminProduct({ id: product._id, hardDelete: false }))
        .unwrap()
        .then((res) => {
          toast.success(res.message || 'Product deactivated.');
          loadProducts();
        })
        .catch((err) => {
          toast.error(err || 'Failed to deactivate product');
        });
    }
  };

  const handlePermanentDeleteClick = (product) => {
    const isPerm = window.confirm(
      `⚠️ WARNING: Permanent Deletion!\n\nAre you sure you want to permanently delete "${product.name}"? This removes the product database entry and all associated images from Cloudinary. This action CANNOT be undone.`
    );
    
    if (isPerm) {
      dispatch(deleteAdminProduct({ id: product._id, hardDelete: true }))
        .unwrap()
        .then((res) => {
          toast.success(res.message || 'Product permanently deleted.');
          loadProducts();
        })
        .catch((err) => {
          toast.error(err || 'Failed to delete product permanently');
        });
    }
  };

  const getStockBadgeClass = (totalStock) => {
    if (totalStock === 0) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (totalStock < 10) return 'bg-orange-50 text-orange-700 border-orange-100';
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  };

  const getStockBadgeText = (totalStock) => {
    if (totalStock === 0) return 'Out of Stock';
    if (totalStock < 10) return `Low Stock (${totalStock})`;
    return `In Stock (${totalStock})`;
  };

  // Helper: calculate total stock across sizes
  const calculateTotalStock = (sizesArray) => {
    if (!sizesArray) return 0;
    return sizesArray.reduce((acc, curr) => acc + (curr.stock || 0), 0);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-brand-dark-100 shadow-sm">
        <div className="space-y-1">
          <h3 className="font-display font-bold text-base text-brand-dark-900">Merchandise Catalog</h3>
          <p className="font-sans text-xs text-brand-dark-400">Total products registered: <span className="font-bold text-brand-maroon-700">{products.length}</span></p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="btn-primary py-2.5 px-5 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Add Merchandise</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-brand-dark-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96 flex">
          <input
            type="text"
            className="input-field py-2 pl-10 pr-4 text-xs font-sans"
            placeholder="Search products by title, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 text-brand-dark-400 absolute left-3.5 top-3" />
          <button 
            type="submit" 
            className="ml-2 btn-secondary py-2 px-4 text-xs font-bold bg-brand-dark-50 border border-brand-dark-200"
          >
            Go
          </button>
        </form>

        {/* Category Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto scrollbar-thin py-1">
          <div className="flex items-center gap-1.5 text-xs text-brand-dark-500 font-semibold mr-1.5 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-brand-maroon-700" />
            <span>Category:</span>
          </div>
          {['all', 'tshirts', 'hoodies', 'accessories', 'stationery'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold capitalize transition-all duration-200 flex-shrink-0 ${
                categoryFilter === cat
                  ? 'bg-brand-maroon-50 border-brand-maroon-200 text-brand-maroon-700'
                  : 'bg-white border-brand-dark-200 text-brand-dark-600 hover:border-brand-maroon-350'
              }`}
            >
              {cat === 'all' ? 'All Items' : cat === 'tshirts' ? 'T-Shirts' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table Container */}
      <div className="bg-white rounded-2xl border border-brand-dark-100 shadow-premium overflow-hidden">
        {productsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-brand-maroon-700 animate-spin" />
            <span className="text-xs font-sans text-brand-dark-400 font-semibold">Updating catalog list...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-brand-dark-500 font-sans text-sm">
            No products match the selected criteria. Create one to get started!
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-dark-50/50 border-b border-brand-dark-100 text-brand-dark-500 font-sans text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Product Details</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price (INR)</th>
                  <th className="py-4 px-6">Inventory Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark-100 font-sans text-xs">
                {products.map((prod) => {
                  const totalStock = calculateTotalStock(prod.sizes);
                  return (
                    <tr 
                      key={prod._id} 
                      className={`hover:bg-brand-dark-50/30 transition-colors ${
                        !prod.isActive ? 'opacity-70 bg-brand-dark-50/10' : ''
                      }`}
                    >
                      {/* Product details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4.5">
                          <div className="w-11 h-11 rounded-lg border border-brand-dark-100 overflow-hidden flex-shrink-0 bg-brand-dark-50">
                            <img 
                              src={prod.images?.[0] || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=100'} 
                              alt={prod.name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-display font-bold text-sm text-brand-dark-900 truncate max-w-[240px] leading-snug">
                              {prod.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              {!prod.isActive && (
                                <span className="inline-flex px-1.5 py-0.5 rounded border border-brand-dark-200 bg-brand-dark-100 text-brand-dark-500 text-[9px] font-bold uppercase tracking-wider">
                                  Inactive
                                </span>
                              )}
                              {prod.isFeatured && (
                                <span className="inline-flex px-1.5 py-0.5 rounded border border-brand-gold-200 bg-brand-gold-50 text-brand-gold-700 text-[9px] font-bold uppercase tracking-wider">
                                  Featured
                                </span>
                              )}
                              <span className="text-[10px] text-brand-dark-400 font-medium">
                                Sizes: {prod.sizes?.map(s => s.size).join(', ') || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6 text-brand-dark-600 font-semibold capitalize">
                        {prod.category === 'tshirts' ? 'T-Shirts' : prod.category}
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 font-bold text-brand-dark-900">
                        <span>₹{prod.price}</span>
                        {prod.comparePrice && (
                          <span className="text-[10px] text-brand-dark-400 font-normal line-through ml-1.5">
                            ₹{prod.comparePrice}
                          </span>
                        )}
                      </td>

                      {/* Inventory */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide ${getStockBadgeClass(totalStock)}`}>
                          {getStockBadgeText(totalStock)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-1.5 rounded-lg text-brand-dark-500 hover:bg-brand-dark-100 hover:text-brand-dark-800 transition-colors"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteClick(prod)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            prod.isActive
                              ? 'text-brand-dark-400 hover:bg-brand-dark-100 hover:text-brand-dark-800'
                              : 'text-brand-gold-600 hover:bg-brand-gold-50'
                          }`}
                          title={prod.isActive ? 'Deactivate Product' : 'Deactivated'}
                          disabled={!prod.isActive}
                        >
                          {prod.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handlePermanentDeleteClick(prod)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <ProductFormModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProduct}
        product={selectedProduct}
        isSaving={adminLoading.products}
      />
    </div>
  );
};

export default AdminProducts;
