import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { SlidersHorizontal, Grid3X3, RefreshCw } from 'lucide-react';
import { fetchProducts, setFilter, resetFilters } from '../features/products/productSlice';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard from '../components/ProductCard';

const ProductList = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: products, loading, filters } = useSelector((state) => state.products);
  const safeProducts = Array.isArray(products) ? products.filter((p) => p.isActive !== false) : [];
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // 1. Sync URL query parameters to Redux state on load
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const size = searchParams.get('size') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const sort = searchParams.get('sort') || 'newest';

    dispatch(setFilter({ search, category, size, minPrice, maxPrice, sort }));
  }, [searchParams, dispatch]);

  // 2. Fetch products whenever Redux filters state change
  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [filters, dispatch]);

  // 3. Update URL search parameters when Redux filters change
  const handleFilterChange = (newFilters) => {
    dispatch(setFilter(newFilters));

    // Construct new search params object
    const updatedParams = { ...filters, ...newFilters };
    const params = {};
    
    Object.keys(updatedParams).forEach((key) => {
      if (updatedParams[key]) {
        params[key] = updatedParams[key];
      }
    });
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Page Title */}
      <div className="text-left mb-8">
        <h1 className="section-heading">University Catalog</h1>
        <p className="section-subheading">
          Discover certified apparel, backpacks, caps, and campus accessories.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* DESKTOP SIDEBAR FILTER (Hidden on Mobile) */}
        <aside className="hidden lg:block lg:col-span-1 border-r border-brand-dark-200 pr-6 h-fit sticky top-24">
          <FilterSidebar 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onReset={handleResetFilters}
          />
        </aside>

        {/* PRODUCTS VIEWPORT (3/4 cols) */}
        <main className="lg:col-span-3 flex flex-col gap-6">
          {/* Top Bar Sort / Mobile Action Toggle */}
          <div className="flex justify-between items-center bg-white border border-brand-dark-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setMobileFilterOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-dark-50 hover:bg-brand-dark-100 border border-brand-dark-200 lg:hidden text-brand-dark-700 font-sans font-semibold text-xs rounded-xl transition-all duration-200"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filter
              </button>
              <span className="font-sans text-xs text-brand-dark-500 font-semibold hidden sm:inline">
                Showing {safeProducts.length} {safeProducts.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <label className="font-sans text-xs text-brand-dark-500 font-semibold hidden md:inline">Sort By</label>
              <select
                value={filters.sort || 'newest'}
                onChange={(e) => handleFilterChange({ sort: e.target.value })}
                className="px-3.5 py-2 bg-brand-dark-50 border border-brand-dark-200 rounded-xl font-sans text-xs font-semibold text-brand-dark-700 focus:outline-none focus:ring-1 focus:ring-brand-maroon-500 focus:border-transparent"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Catalog Products Grid */}
          {loading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="card-premium h-[380px] bg-white flex flex-col gap-4 p-4 animate-pulse">
                  <div className="aspect-[4/5] bg-brand-dark-100 rounded-xl w-full"></div>
                  <div className="h-4 bg-brand-dark-100 rounded-md w-1/3"></div>
                  <div className="h-6 bg-brand-dark-100 rounded-md w-3/4"></div>
                  <div className="h-5 bg-brand-dark-100 rounded-md w-1/4 mt-auto"></div>
                </div>
              ))}
            </div>
          ) : safeProducts.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-brand-dark-100 rounded-2xl shadow-sm text-center">
              <div className="p-4 bg-brand-maroon-50 text-brand-maroon-700 rounded-2xl mb-4">
                <Grid3X3 className="w-10 h-10" />
              </div>
              <h3 className="font-display font-bold text-lg text-brand-dark-900">No Products Found</h3>
              <p className="font-sans text-sm text-brand-dark-500 mt-2 max-w-sm">
                We couldn't find any products matching your current search or filter preferences.
              </p>
              <button 
                onClick={handleResetFilters}
                className="btn-primary mt-6 text-sm px-6 py-2.5"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Search Filters
              </button>
            </div>
          ) : (
            /* Products Grid display */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {safeProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* MOBILE DRAWER FILTER BACKDROP & SLIDEOVER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setMobileFilterOpen(false)}
            className="fixed inset-0 bg-brand-dark-950/40 backdrop-blur-xs transition-opacity duration-300"
          ></div>
          
          {/* Sliding panel drawer */}
          <div className="fixed inset-y-0 left-0 w-80 bg-white max-w-full shadow-2xl flex flex-col z-50 transform animate-slideRight">
            <div className="overflow-y-auto h-full scrollbar-thin">
              <FilterSidebar 
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                onClose={() => setMobileFilterOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
