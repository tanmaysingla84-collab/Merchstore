import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Star, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { addToCart } from '../features/cart/cartSlice';
import { useAuth } from '../hooks/useAuth';
import { redirectToLogin } from '../utils/authRedirect';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  const { _id, name, price, images, category, averageRating, sizes } = product;

  const totalStock = sizes.reduce((acc, curr) => acc + curr.stock, 0);
  const isOutOfStock = totalStock === 0;
  const isLowStock = totalStock > 0 && totalStock <= 10;

  const handleQuickAdd = (e) => {
    e.preventDefault();

    const availableSize = sizes.find((s) => s.stock > 0);
    if (!availableSize) {
      toast.error('This product is currently out of stock.');
      return;
    }

    if (!isLoggedIn) {
      toast.error('Please login to add items to your cart.');
      redirectToLogin(navigate, location, {
        productId: _id,
        qty: 1,
        size: availableSize.size,
        productName: name,
      });
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
      className="group flex flex-col h-full bg-white rounded-[24px] border border-brand-dark-100/60 overflow-hidden hover:border-brand-maroon-200/40 hover:shadow-premium transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative hover:-translate-y-1"
    >
      <span className="absolute top-3.5 left-3.5 z-10 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-md border border-brand-dark-100/45 font-sans font-bold text-[9px] text-brand-maroon-700 tracking-wider uppercase shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        {category}
      </span>

      {isOutOfStock && (
        <span className="absolute top-3.5 right-3.5 z-10 px-2.5 py-1 rounded-lg bg-brand-dark-900/90 backdrop-blur-md text-white font-sans font-black text-[9px] uppercase tracking-wider shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
          Sold Out
        </span>
      )}
      {!isOutOfStock && isLowStock && (
        <span className="absolute top-3.5 right-3.5 z-10 px-2.5 py-1 rounded-lg bg-brand-gold-500 text-brand-dark-950 font-sans font-black text-[9px] uppercase tracking-wider shadow-[0_4px_12px_-2px_rgba(212,175,55,0.35)]">
          {totalStock} Left
        </span>
      )}

      <div className="relative aspect-[4/5] bg-brand-dark-50/50 overflow-hidden">
        <img
          src={images[0]}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        />

        {!isOutOfStock && (
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-4 right-4 p-3 bg-brand-maroon-700 hover:bg-brand-maroon-600 text-white rounded-2xl shadow-lg translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-10 hover:scale-105 active:scale-95"
            title="Quick Add to Cart"
          >
            <ShoppingCart className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow gap-2.5">
        <div className="flex items-center gap-1.5">
          <div className="flex text-brand-gold-500">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star
                key={idx}
                className={`w-3 h-3 ${
                  idx < Math.round(averageRating) ? 'fill-brand-gold-500' : 'text-brand-dark-200'
                }`}
              />
            ))}
          </div>
          <span className="font-sans text-[10px] text-brand-dark-450 font-semibold">
            {(averageRating || 0).toFixed(1)}
          </span>
        </div>

        <h3 className="font-display font-bold text-sm text-brand-dark-900 leading-snug group-hover:text-brand-maroon-700 transition-colors line-clamp-2">
          {name}
        </h3>

        <div className="mt-auto pt-1">
          <span className="font-sans font-extrabold text-base text-brand-dark-900">
            ₹{price.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
