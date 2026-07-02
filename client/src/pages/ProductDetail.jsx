import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, ShoppingBag, Plus, Minus, ArrowLeft, Heart, Shield, Award, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProductById, clearSelectedProduct } from '../features/products/productSlice';
import { addToCart } from '../features/cart/cartSlice';
import { useAuth } from '../hooks/useAuth';
import { redirectToLogin } from '../utils/authRedirect';
import api from '../utils/api';
import Loader from '../components/Loader';

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();
  
  const { selectedProduct: product, loading, error } = useSelector((state) => state.products);
  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // 1. Fetch Product and Reviews on mount
  useEffect(() => {
    dispatch(fetchProductById(id));
    loadReviews();

    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [id, dispatch]);

  // Set initial image when product loads
  useEffect(() => {
    if (product && product.images?.length > 0) {
      setActiveImage(product.images[0]);
      
      // Auto-select first in-stock size if available
      const firstInStock = product.sizes?.find(s => s.stock > 0);
      if (firstInStock) {
        setSelectedSize(firstInStock.size);
      }
    }
  }, [product]);

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await api.get(`/reviews/${id}`);
      setReviews(response.data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h3 className="font-display font-bold text-xl text-brand-dark-900">Product Not Found</h3>
        <p className="font-sans text-brand-dark-500 mt-2">{error}</p>
        <Link to="/products" className="btn-primary mt-6 inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to Shop Catalog
        </Link>
      </div>
    );
  }

  if (!product) return null;

  const currentSizeObj = product.sizes?.find(s => s.size === selectedSize);
  const currentStock = currentSizeObj ? currentSizeObj.stock : 0;
  const isOutOfStock = currentStock === 0;

  const handleQtyChange = (action) => {
    if (action === 'inc') {
      if (qty >= currentStock) {
        toast.error(`Only ${currentStock} items in stock for size ${selectedSize}`);
        return;
      }
      setQty(qty + 1);
    } else {
      if (qty > 1) {
        setQty(qty - 1);
      }
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size first.');
      return;
    }

    if (!isLoggedIn) {
      toast.error('Please login to add items to your cart.');
      redirectToLogin(navigate, location, {
        productId: product._id,
        qty,
        size: selectedSize,
        productName: product.name,
      });
      return;
    }

    dispatch(addToCart({ productId: product._id, qty, size: selectedSize }))
      .unwrap()
      .then(() => {
        toast.success(`Added ${product.name} (${selectedSize}) to cart!`);
      })
      .catch((err) => {
        toast.error(err || 'Failed to add item');
      });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error('You must be signed in to submit a review.');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please write a comment for your review.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await api.post(`/reviews/${product._id}`, { rating: reviewRating, comment: reviewComment });
      toast.success('Thank you! Review posted successfully.');
      setReviewComment('');
      setReviewRating(5);
      loadReviews(); // Reload review listings
      dispatch(fetchProductById(id)); // Reload product details to update avg rating
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      {/* Back Link */}
      <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark-600 hover:text-brand-maroon-700 transition-colors mb-10">
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left mb-16">
        {/* LEFT COLUMN: IMAGES GALLERY (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-[4/5] bg-brand-dark-100 rounded-3xl overflow-hidden border border-brand-dark-200 shadow-sm relative">
            <img 
              src={activeImage || product.images?.[0]} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails list */}
          {product.images?.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-200 ${
                    activeImage === img ? 'border-brand-maroon-700 shadow-md scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`thumbnail-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PRODUCT SPECIFICATIONS & ACTIONS (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="space-y-3">
            <span className="px-2.5 py-1 rounded bg-brand-maroon-50 border border-brand-maroon-100 font-sans font-semibold text-[10px] text-brand-maroon-700 uppercase tracking-wider">
              {product.category}
            </span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-dark-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars summary */}
            <div className="flex items-center gap-2">
              <div className="flex text-brand-gold-500">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star 
                    key={idx} 
                    className={`w-4 h-4 ${
                      idx < Math.round(product.averageRating || 0) ? 'fill-brand-gold-500' : 'text-brand-dark-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-sans font-bold text-sm text-brand-dark-700 mt-0.5">
                {product.averageRating?.toFixed(1) || '0.0'}
              </span>
              <span className="font-sans text-xs text-brand-dark-400 font-medium mt-0.5">
                ({product.ratingsCount} verified reviews)
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="py-4 border-t border-b border-brand-dark-200 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-sans text-[10px] text-brand-dark-400 font-bold uppercase tracking-wider">Price</span>
              <span className="font-sans font-black text-3xl text-brand-dark-950 mt-1">
                ₹{product.price?.toLocaleString('en-IN')}.00
              </span>
            </div>
            
            {/* Stock Badge */}
            <div className="flex flex-col items-end">
              <span className="font-sans text-[10px] text-brand-dark-400 font-bold uppercase tracking-wider">Availability</span>
              {isOutOfStock ? (
                <span className="mt-1 px-3 py-1 bg-red-100 text-red-700 font-sans font-bold text-xs rounded-full">
                  Sold Out
                </span>
              ) : currentStock <= 5 ? (
                <span className="mt-1 px-3 py-1 bg-brand-gold-100 text-brand-gold-800 font-sans font-bold text-xs rounded-full">
                  Low Stock: Only {currentStock} left
                </span>
              ) : (
                <span className="mt-1 px-3 py-1 bg-green-100 text-green-700 font-sans font-bold text-xs rounded-full">
                  In Stock ({currentStock} available)
                </span>
              )}
            </div>
          </div>

          {/* SIZES SELECTOR */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <label className="font-sans font-bold text-xs uppercase tracking-wider text-brand-dark-700">
                Select Size
              </label>
              <button className="font-sans text-xs font-semibold text-brand-maroon-700 hover:text-brand-maroon-600 border-b border-dashed border-brand-maroon-300">
                View Size Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {product.sizes?.map((sizeObj, idx) => {
                const isSelected = selectedSize === sizeObj.size;
                const isSizeOut = sizeObj.stock === 0;

                return (
                  <button
                    key={idx}
                    disabled={isSizeOut}
                    onClick={() => {
                      setSelectedSize(sizeObj.size);
                      setQty(1); // Reset qty to 1 when changing size
                    }}
                    className={`px-5 py-3 border rounded-xl font-sans text-sm font-bold tracking-wider transition-all duration-200 flex flex-col items-center min-w-16 ${
                      isSizeOut 
                        ? 'bg-brand-dark-50 border-brand-dark-200 text-brand-dark-350 opacity-40 cursor-not-allowed line-through' 
                        : isSelected
                          ? 'bg-brand-maroon-700 border-brand-maroon-700 text-white shadow-md' 
                          : 'bg-white border-brand-dark-200 text-brand-dark-800 hover:border-brand-maroon-400 hover:text-brand-maroon-700'
                    }`}
                  >
                    <span>{sizeObj.size}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUANTITY SELECTOR AND CART CTA */}
          <div className="flex gap-4 items-end mt-2">
            {/* Quantity Stepper */}
            <div className="space-y-3">
              <label className="block font-sans font-bold text-xs uppercase tracking-wider text-brand-dark-700">
                Quantity
              </label>
              <div className="flex items-center border border-brand-dark-200 bg-white rounded-xl h-14">
                <button
                  type="button"
                  disabled={isOutOfStock || qty <= 1}
                  onClick={() => handleQtyChange('dec')}
                  className="px-4 py-2 hover:text-brand-maroon-700 text-brand-dark-500 disabled:opacity-30 disabled:hover:text-inherit transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-sans font-bold text-brand-dark-900">
                  {qty}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleQtyChange('inc')}
                  className="px-4 py-2 hover:text-brand-maroon-700 text-brand-dark-500 disabled:opacity-30 disabled:hover:text-inherit transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || !selectedSize}
              className="flex-grow btn-primary h-14 text-base"
            >
              <ShoppingBag className="w-5 h-5" />
              Add to Shopping Cart
            </button>
          </div>

          {/* Assurance bullet cards */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-6 border-t border-brand-dark-200 text-xs text-brand-dark-600">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4.5 h-4.5 text-brand-gold-600 shrink-0" />
              <span className="font-semibold text-left">Authorized GU merchandise</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Award className="w-4.5 h-4.5 text-brand-gold-600 shrink-0" />
              <span className="font-semibold text-left">Quality fabric assured</span>
            </div>
          </div>
        </div>
      </div>

      {/* DESCRIPTION TABS & REVIEWS SECTION */}
      <section className="bg-white border border-brand-dark-100 rounded-3xl p-6 sm:p-10 shadow-sm text-left">
        {/* Tabs Headers */}
        <div className="flex border-b border-brand-dark-200 gap-8 mb-8">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-4 font-display font-bold text-base transition-all relative ${
              activeTab === 'description' 
                ? 'text-brand-maroon-700 font-extrabold border-b-2 border-brand-maroon-700' 
                : 'text-brand-dark-500 hover:text-brand-maroon-700'
            }`}
          >
            Product Details
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 font-display font-bold text-base transition-all relative ${
              activeTab === 'reviews' 
                ? 'text-brand-maroon-700 font-extrabold border-b-2 border-brand-maroon-700' 
                : 'text-brand-dark-500 hover:text-brand-maroon-700'
            }`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab 1: Description */}
        {activeTab === 'description' && (
          <div className="space-y-6 animate-fadeIn">
            <p className="font-sans text-brand-dark-600 leading-relaxed text-base">
              {product.description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-sm font-sans text-brand-dark-600">
              <div className="space-y-3">
                <h4 className="font-display font-bold text-brand-dark-900 text-sm">Specifications</h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Original embroidered crest / printed emblem</li>
                  <li>Double stitching on seams for lifetime durability</li>
                  <li>Colors: {product.colors?.join(', ')}</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-display font-bold text-brand-dark-900 text-sm">Care Instructions</h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Machine wash cold with like colors</li>
                  <li>Tumble dry low or air dry</li>
                  <li>Do not iron embroidery directly</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Reviews (With review submission form!) */}
        {activeTab === 'reviews' && (
          <div className="space-y-10 animate-fadeIn">
            {/* Reviews display list */}
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg text-brand-dark-900">
                Verified Reviews ({reviews.length})
              </h3>
              
              {reviewsLoading ? (
                <div className="py-6 space-y-4">
                  <div className="h-4 bg-brand-dark-100 rounded w-1/4 animate-pulse"></div>
                  <div className="h-10 bg-brand-dark-100 rounded w-full animate-pulse"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-6 text-center text-brand-dark-500 font-sans text-sm">
                  No reviews yet for this product. Be the first to share your thoughts!
                </div>
              ) : (
                <div className="divide-y divide-brand-dark-100">
                  {reviews.map((rev, idx) => (
                    <div key={idx} className="py-5 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-display font-bold text-brand-dark-900 text-sm">{rev.userName}</span>
                        <span className="font-sans text-xs text-brand-dark-400">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex text-brand-gold-500">
                        {Array.from({ length: 5 }).map((_, sIdx) => (
                          <Star 
                            key={sIdx} 
                            className={`w-3.5 h-3.5 ${
                              sIdx < rev.rating ? 'fill-brand-gold-500' : 'text-brand-dark-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="font-sans text-brand-dark-600 text-sm leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Review Form */}
            {isLoggedIn ? (
              <div className="border-t border-brand-dark-100 pt-8 space-y-5">
                <h3 className="font-display font-bold text-lg text-brand-dark-900">
                  Write a Review
                </h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-xl">
                  {/* Star selector */}
                  <div className="space-y-2">
                    <label className="block font-sans font-bold text-xs uppercase tracking-wider text-brand-dark-700">
                      Overall Rating
                    </label>
                    <div className="flex gap-1.5">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const starVal = idx + 1;
                        return (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setReviewRating(starVal)}
                            className="p-1 hover:scale-115 transition-transform text-brand-gold-500"
                          >
                            <Star 
                              className={`w-6 h-6 ${
                                starVal <= reviewRating ? 'fill-brand-gold-500' : 'text-brand-dark-200'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="space-y-2">
                    <label className="block font-sans font-bold text-xs uppercase tracking-wider text-brand-dark-700">
                      Comments / Review
                    </label>
                    <textarea
                      rows="4"
                      className="input-field text-sm py-3"
                      placeholder="Share your experience wearing or using this product..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Submit */}
                  <button 
                    type="submit" 
                    disabled={isSubmittingReview}
                    className="btn-primary px-6 py-3 text-sm font-semibold"
                  >
                    Submit Review Comments
                  </button>
                </form>
              </div>
            ) : (
              <div className="border-t border-brand-dark-100 pt-8 text-center py-6 bg-brand-dark-50 rounded-2xl">
                <p className="font-sans text-sm text-brand-dark-600">
                  You must be{' '}
                  <Link to="/login" state={{ from: location }} className="font-bold text-brand-maroon-700 hover:underline">logged in</Link>
                  {' '}to write a product review.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProductDetail;
