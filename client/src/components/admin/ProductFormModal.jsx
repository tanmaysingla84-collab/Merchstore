import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductFormModal = ({ isOpen, onClose, onSave, product, isSaving }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('tshirts');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [tagsInput, setTagsInput] = useState('');
  const [sizes, setSizes] = useState([{ size: 'M', stock: 10, sku: '' }]);
  
  // Images
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  // Load product if editing
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setCategory(product.category || 'tshirts');
      setPrice(product.price || '');
      setComparePrice(product.comparePrice || '');
      setIsFeatured(product.isFeatured || false);
      setIsActive(product.isActive !== undefined ? product.isActive : true);
      setTagsInput(product.tags ? product.tags.join(', ') : '');
      setSizes(product.sizes?.length > 0 ? product.sizes.map(s => ({ ...s })) : [{ size: 'M', stock: 10, sku: '' }]);
      setExistingImages(product.images || []);
      setNewImages([]);
      setImagePreviews([]);
      setRemovedImages([]);
    } else {
      // Clear form for add mode
      setName('');
      setDescription('');
      setCategory('tshirts');
      setPrice('');
      setComparePrice('');
      setIsFeatured(false);
      setIsActive(true);
      setTagsInput('');
      setSizes([{ size: 'M', stock: 10, sku: '' }]);
      setExistingImages([]);
      setNewImages([]);
      setImagePreviews([]);
      setRemovedImages([]);
    }
  }, [product, isOpen]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  if (!isOpen) return null;

  const handleAddSize = () => {
    setSizes([...sizes, { size: 'M', stock: 10, sku: '' }]);
  };

  const handleRemoveSize = (index) => {
    if (sizes.length === 1) {
      toast.error('At least one size mapping must be provided.');
      return;
    }
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleSizeChange = (index, field, value) => {
    const updated = [...sizes];
    if (field === 'stock') {
      updated[index][field] = parseInt(value, 10) || 0;
    } else {
      updated[index][field] = value;
    }
    setSizes(updated);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (existingImages.length - removedImages.length + newImages.length + files.length > 5) {
      toast.error('Maximum 5 images allowed per product.');
      return;
    }

    setNewImages([...newImages, ...files]);
    
    // Generate previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const handleRemoveNewImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setNewImages(newImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (url) => {
    setRemovedImages([...removedImages, url]);
  };

  const handleUndoRemoveExistingImage = (url) => {
    setRemovedImages(removedImages.filter(img => img !== url));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) return toast.error('Product Name is required.');
    if (!description.trim() || description.length < 10) return toast.error('Description must be at least 10 characters.');
    if (!price || parseFloat(price) < 0) return toast.error('Valid price is required.');

    // Prepare tags
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    // Prepare sizes and generate default SKU if empty
    const processedSizes = sizes.map(s => ({
      size: s.size.toUpperCase(),
      stock: parseInt(s.stock, 10) || 0,
      sku: s.sku.trim() || `GU-${category.toUpperCase()}-${s.size.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
    }));

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('category', category);
    formData.append('price', parseFloat(price));
    if (comparePrice) formData.append('comparePrice', parseFloat(comparePrice));
    formData.append('isFeatured', isFeatured);
    formData.append('isActive', isActive);
    formData.append('sizes', JSON.stringify(processedSizes));
    formData.append('tags', JSON.stringify(tags));

    // Files
    newImages.forEach(file => {
      formData.append('images', file);
    });

    // Removals (only for edit)
    if (product) {
      removedImages.forEach(url => {
        formData.append('removedImages', url);
      });
    }

    onSave(formData);
  };

  const activeExistingImages = existingImages.filter(img => !removedImages.includes(img));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-brand-dark-100 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-dark-100 flex-shrink-0">
          <h2 className="font-display font-extrabold text-lg text-brand-dark-900">
            {product ? 'Edit University Product' : 'Add New Merchandise'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-brand-dark-400 hover:bg-brand-dark-50 hover:text-brand-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Title / Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark-500">Product Name</label>
              <input 
                type="text" 
                className="input-field py-2.5 text-sm"
                placeholder="e.g. Geeta University Varsity Jacket"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark-500">Category</label>
              <select
                className="input-field py-2.5 text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%23475569%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="tshirts">T-Shirts</option>
                <option value="hoodies">Hoodies & Jackets</option>
                <option value="accessories">Accessories</option>
                <option value="stationery">Stationery</option>
              </select>
            </div>

            {/* Description */}
            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark-500">Description</label>
              <textarea 
                rows="3"
                className="input-field py-2.5 text-sm"
                placeholder="Write detailed specifications, features, materials and care instructions..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Prices */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark-500">Selling Price (₹)</label>
              <input 
                type="number" 
                className="input-field py-2.5 text-sm"
                placeholder="e.g. 999"
                value={price}
                onChange={e => setPrice(e.target.value)}
                min="0"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark-500">Compare Price (₹) <span className="text-[10px] text-brand-dark-400 font-normal font-sans lowercase">(shows strikethrough)</span></label>
              <input 
                type="number" 
                className="input-field py-2.5 text-sm"
                placeholder="e.g. 1499"
                value={comparePrice}
                onChange={e => setComparePrice(e.target.value)}
                min="0"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark-500">Tags <span className="text-[10px] text-brand-dark-400 font-normal font-sans lowercase">(comma separated)</span></label>
              <input 
                type="text" 
                className="input-field py-2.5 text-sm"
                placeholder="e.g. premium, embroidered, varsity"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
              />
            </div>

            {/* Settings */}
            <div className="flex gap-6 items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  className="w-4 h-4 accent-brand-maroon-700 rounded border-brand-dark-300 focus:ring-brand-maroon-500"
                  checked={isFeatured}
                  onChange={e => setIsFeatured(e.target.checked)}
                />
                <span className="text-xs font-bold font-sans uppercase tracking-wider text-brand-dark-600">Featured Item</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  className="w-4 h-4 accent-brand-maroon-700 rounded border-brand-dark-300 focus:ring-brand-maroon-500"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                />
                <span className="text-xs font-bold font-sans uppercase tracking-wider text-brand-dark-600">In Stock / Active</span>
              </label>
            </div>

          </div>

          <div className="h-px bg-brand-dark-100 my-6"></div>

          {/* Sizes and Inventory Manager */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="font-display font-bold text-sm text-brand-dark-900">Sizing & Inventory Mapping</h3>
                <p className="font-sans text-[11px] text-brand-dark-450">Add sizes, configure SKU identifiers and stock levels.</p>
              </div>
              <button
                type="button"
                onClick={handleAddSize}
                className="btn-secondary py-1.5 px-3 text-xs font-semibold hover:bg-brand-maroon-50 hover:text-brand-maroon-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {sizes.map((sz, idx) => (
                <div key={idx} className="flex gap-4 items-center bg-brand-dark-50 p-3 rounded-xl border border-brand-dark-100 animate-fadeIn">
                  {/* Size Selector */}
                  <div className="w-1/4">
                    <select
                      className="input-field py-1.5 px-2 text-xs"
                      value={sz.size}
                      onChange={e => handleSizeChange(idx, 'size', e.target.value)}
                    >
                      <option value="S">S (Small)</option>
                      <option value="M">M (Medium)</option>
                      <option value="L">L (Large)</option>
                      <option value="XL">XL (Extra Large)</option>
                      <option value="XXL">XXL (Double XL)</option>
                      <option value="FREE">FREE SIZE</option>
                    </select>
                  </div>

                  {/* Stock Input */}
                  <div className="w-1/4">
                    <input 
                      type="number" 
                      className="input-field py-1.5 px-2.5 text-xs"
                      placeholder="Stock"
                      value={sz.stock}
                      onChange={e => handleSizeChange(idx, 'stock', e.target.value)}
                      min="0"
                      required
                    />
                  </div>

                  {/* SKU Input */}
                  <div className="flex-grow">
                    <input 
                      type="text" 
                      className="input-field py-1.5 px-2.5 text-xs"
                      placeholder="Custom SKU (auto-generated if empty)"
                      value={sz.sku}
                      onChange={e => handleSizeChange(idx, 'sku', e.target.value)}
                    />
                  </div>

                  {/* Remove Action */}
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(idx)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-brand-dark-100 my-6"></div>

          {/* Media / Image Upload Manager */}
          <div className="space-y-4">
            <div className="space-y-0.5">
              <h3 className="font-display font-bold text-sm text-brand-dark-900">Product Images (Max 5)</h3>
              <p className="font-sans text-[11px] text-brand-dark-450">Upload merchandise pictures (JPG/PNG). Multi-image uploads are supported.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {/* Existing Images */}
              {existingImages.map((img, idx) => {
                const isRemoved = removedImages.includes(img);
                return (
                  <div key={`exist-${idx}`} className={`relative aspect-square border rounded-xl overflow-hidden group ${
                    isRemoved ? 'border-red-300 opacity-60 bg-red-50' : 'border-brand-dark-200'
                  }`}>
                    <img src={img} alt="product" className="w-full h-full object-cover" />
                    {isRemoved ? (
                      <div className="absolute inset-0 bg-red-900/10 flex flex-col items-center justify-center p-2">
                        <span className="text-[9px] font-bold text-red-700 uppercase bg-white border border-red-200 px-1 py-0.5 rounded shadow">Marked delete</span>
                        <button
                          type="button"
                          onClick={() => handleUndoRemoveExistingImage(img)}
                          className="mt-1.5 text-[10px] font-bold text-brand-maroon-700 hover:underline bg-white px-2 py-0.5 rounded shadow"
                        >
                          Undo
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(img)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* New image uploads */}
              {imagePreviews.map((url, idx) => (
                <div key={`new-${idx}`} className="relative aspect-square border border-brand-maroon-200 rounded-xl overflow-hidden group">
                  <img src={url} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-1.5 left-1.5 px-1 py-0.5 bg-brand-maroon-700 text-white rounded text-[8px] font-bold uppercase tracking-wider shadow">New</div>
                </div>
              ))}

              {/* Upload trigger slot */}
              {activeExistingImages.length + newImages.length < 5 && (
                <label className="border-2 border-dashed border-brand-dark-200 hover:border-brand-maroon-500 rounded-xl flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-brand-dark-50/50 transition-all duration-300">
                  <Upload className="w-5 h-5 text-brand-dark-400 mb-1" />
                  <span className="text-[10px] font-sans font-bold text-brand-dark-500 uppercase tracking-wider">Upload Image</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="hidden" 
                  />
                </label>
              )}
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-5 border-t border-brand-dark-100 flex justify-end gap-3 flex-shrink-0 bg-brand-dark-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-2.5 px-4 text-xs font-semibold"
            disabled={isSaving}
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary py-2.5 px-6 text-xs font-semibold"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{product ? 'Save Changes' : 'Publish Product'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
