import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Star, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { addToCart } from '../features/cart/cartSlice';
import { useAuth } from '../hooks/useAuth';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { isLoggedIn } = useAuth();
  
  const { _id, name, price, images, category, averageRating, sizes } = product;

  // Determine stock availability
  const totalStock = sizes.reduce((acc, curr) => acc + curr.stock, 0);
  const isOutOfStock = totalStock === 0;
  const isLowStock = totalStock > 0 && totalStock <= 10;

  const handleQuickAdd = (e) => {
    e.preventDefault(); // Prevent navigating to detail page on card click

    if (!isLoggedIn) {
      toast.error('Please login to add items to your cart.');
      return;
    }

    // Default to the first available size in stock
    const availableSize = sizes.find(s => s.stock > 0);
    if (!availableSize) {
      toast.error('This product is currently out of stock.');
      return;
    }

    dispatch(addToCart({ productId: _id, qty: 1, size: availableSize.size }))
      .unwrap()
      .then(() => {
        toast.success(`Added ${name} (${availableSize.size}) to cart!`);
      })
      .catch((err) => {
        toast.error(err || 'Failed to add item');
      });
  };

  return (
    <Link 
      to={`/products/${_id}`}
      className="group card-premium flex flex-col h-full bg-white relative"
    >
      {/* Category Badge */}
      <span className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs border border-brand-dark-100 font-sans font-semibold text-[10px] text-brand-maroon-700 tracking-wider uppercase shadow-sm">
        {category}
      </span>

      {/* Stock indicators */}
      {isOutOfStock && (
        <span className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-md bg-red-600 text-white font-sans font-bold text-[10px] uppercase shadow-sm">
          Sold Out
        </span>
      )}
      {!isOutOfStock && isLowStock && (
        <span className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-md bg-brand-gold-500 text-brand-dark-950 font-sans font-bold text-[10px] uppercase shadow-sm">
          Only {totalStock} Left
        </span>
      )}

      {/* Product Image */}
      <div className="relative aspect-[4/5] bg-brand-dark-100 overflow-hidden w-full">
        <img 
          src={images[0]} 
          alt={name} 
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* University logo watermark */}
        <div className="absolute bottom-3 left-3 z-10 w-14 h-14 pointer-events-none select-none">
          <img 
            src="/logo.png" 
            alt="GU Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Quick Add Overlay Button */}
        {!isOutOfStock && (
          <button 
            onClick={handleQuickAdd}
            className="absolute bottom-4 right-4 p-3 bg-brand-maroon-700 hover:bg-brand-maroon-600 text-white rounded-xl shadow-lg transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-25 hover:scale-110 active:scale-95"
            title="Quick Add to Cart"
          >
            <ShoppingCart className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* Product Details */}
      <div className="p-5 flex flex-col flex-grow text-left gap-2.5">
        {/* Rating Stars */}
        <div className="flex items-center gap-1">
          <div className="flex text-brand-gold-500">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star 
                key={idx} 
                className={`w-3.5 h-3.5 ${
                  idx < Math.round(averageRating) ? 'fill-brand-gold-500' : 'text-brand-dark-200'
                }`}
              />
            ))}
          </div>
          <span className="font-sans text-[11px] text-brand-dark-500 font-semibold mt-0.5">
            {averageRating.toFixed(1)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-sm text-brand-dark-900 leading-tight group-hover:text-brand-maroon-700 transition-colors line-clamp-2">
          {name}
        </h3>

        {/* Price */}
        <div className="mt-auto pt-1 flex items-baseline justify-between">
          <span className="font-sans font-bold text-base text-brand-dark-950">
            ₹{price.toLocaleString('en-IN')}.00
          </span>
          <span className="font-sans text-[10px] text-brand-dark-400 font-medium">
            Excl. Taxes
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
