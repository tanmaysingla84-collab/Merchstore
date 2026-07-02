import React from 'react';
import { X, Search } from 'lucide-react';

const FilterSidebar = ({ filters, onFilterChange, onReset, onClose }) => {
  const categories = [
    { name: 'All Categories', value: 'all' },
    { name: 'Varsity Hoodies', value: 'hoodies' },
    { name: 'Heritage Tees', value: 'tshirts' },
    { name: 'Crewneck Sweatshirts', value: 'sweatshirts' },
    { name: 'Academic Accessories', value: 'accessories' }
  ];

  const sizes = ['S', 'M', 'L', 'XL', 'One Size', 'Standard'];

  const handleTextChange = (e) => {
    onFilterChange({ search: e.target.value });
  };

  const handleCategoryChange = (val) => {
    onFilterChange({ category: val });
  };

  const handleSizeChange = (size) => {
    // If clicking active size, deselect it. Otherwise select it.
    const newVal = filters.size === size ? '' : size;
    onFilterChange({ size: newVal });
  };

  const handlePriceChange = (e, field) => {
    onFilterChange({ [field]: e.target.value });
  };

  return (
    <div className="flex flex-col gap-6 text-left p-5 md:p-0 bg-white md:bg-transparent rounded-2xl md:rounded-none h-full">
      {/* Mobile Header Title */}
      <div className="flex justify-between items-center md:hidden border-b border-brand-dark-100 pb-4">
        <h3 className="font-display font-bold text-lg text-brand-dark-900">Filters</h3>
        <button onClick={onClose} className="p-1 rounded-lg text-brand-dark-500 hover:bg-brand-dark-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-brand-dark-700">
          Search
        </h4>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-dark-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            className="input-field pl-9.5 py-2.5 text-sm"
            placeholder="Search products..."
            value={filters.search || ''}
            onChange={handleTextChange}
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-2">
        <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-brand-dark-700">
          Category
        </h4>
        <div className="flex flex-col gap-2">
          {categories.map((cat, idx) => (
            <label 
              key={idx} 
              className="flex items-center gap-2.5 cursor-pointer text-sm font-sans text-brand-dark-600 hover:text-brand-maroon-700 font-medium py-0.5"
            >
              <input
                type="radio"
                name="category"
                checked={filters.category === cat.value}
                onChange={() => handleCategoryChange(cat.value)}
                className="w-4 h-4 text-brand-maroon-700 focus:ring-brand-maroon-500 border-brand-dark-300 rounded"
              />
              <span>{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sizes Toggle */}
      <div className="space-y-2">
        <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-brand-dark-700">
          Size
        </h4>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size, idx) => {
            const isSelected = filters.size === size;
            return (
              <button
                key={idx}
                onClick={() => handleSizeChange(size)}
                className={`px-3.5 py-2 border rounded-xl font-sans text-xs font-semibold tracking-wider transition-all duration-200 ${
                  isSelected 
                    ? 'bg-brand-maroon-700 border-brand-maroon-700 text-white shadow-md' 
                    : 'bg-white border-brand-dark-200 text-brand-dark-700 hover:border-brand-maroon-300 hover:text-brand-maroon-700'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-3">
        <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-brand-dark-700">
          Price Range
        </h4>
        <div className="flex gap-3 items-center">
          <div className="relative flex-grow">
            <span className="absolute left-3 top-2.5 text-xs text-brand-dark-400 font-bold">₹</span>
            <input
              type="number"
              className="w-full pl-6 pr-2 py-2 border border-brand-dark-200 rounded-xl text-sm font-sans text-brand-dark-700 focus:outline-none focus:ring-2 focus:ring-brand-maroon-500 focus:border-transparent"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => handlePriceChange(e, 'minPrice')}
            />
          </div>
          <span className="text-brand-dark-400 font-medium font-sans">-</span>
          <div className="relative flex-grow">
            <span className="absolute left-3 top-2.5 text-xs text-brand-dark-400 font-bold">₹</span>
            <input
              type="number"
              className="w-full pl-6 pr-2 py-2 border border-brand-dark-200 rounded-xl text-sm font-sans text-brand-dark-700 focus:outline-none focus:ring-2 focus:ring-brand-maroon-500 focus:border-transparent"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => handlePriceChange(e, 'maxPrice')}
            />
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <button 
        onClick={onReset}
        className="w-full py-3 border border-brand-maroon-700 text-brand-maroon-700 hover:bg-brand-maroon-50 font-semibold text-sm rounded-xl transition-all duration-200 mt-2"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterSidebar;
