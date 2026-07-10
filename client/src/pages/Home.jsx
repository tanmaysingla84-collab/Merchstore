import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, ShoppingBag, Award, Shield, CheckCircle, Sparkles } from 'lucide-react';
import { fetchProducts } from '../features/products/productSlice';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const Home = () => {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector((state) => state.products);
  const safeProducts = useMemo(() => (Array.isArray(products) ? products : []), [products]);

  useEffect(() => {
    dispatch(fetchProducts({ limit: 100 }));
  }, [dispatch]);

  const featuredProducts = useMemo(() => safeProducts.filter((p) => p.isFeatured).slice(0, 4), [safeProducts]);

  const categoryData = useMemo(() => {
    const defaultCategories = [
      {
        name: 'Premium Hoodies',
        slug: 'hoodies',
        description: 'Heavyweight fleece with gold embroidery.',
        image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Heritage Tees',
        slug: 'tshirts',
        description: '100% combed cotton comfort wear.',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Campus Sweatshirts',
        slug: 'sweatshirts',
        description: 'Minimalist classic crewnecks.',
        image: 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Caps, journals & thermal flasks.',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400',
      },
    ];

    return defaultCategories.map((cat) => {
      const targetSlug = cat.slug === 'sweatshirts' ? 'hoodies' : cat.slug;
      const catProducts = safeProducts.filter(
        (p) => p.category === targetSlug && p.images && p.images.length > 0 && p.isActive
      );
      if (catProducts.length > 0) {
        const randomIndex = Math.floor(Math.random() * catProducts.length);
        const randomProduct = catProducts[randomIndex];
        return {
          ...cat,
          image: randomProduct.images[0],
        };
      }
      return cat;
    });
  }, [safeProducts]);

  const assurances = [
    { icon: Award, title: 'Premium Craftsmanship', desc: 'Shrinkage-free fabrics selected for durability and comfort.' },
    { icon: Shield, title: 'Official GU Identity', desc: 'Authorized crest prints verified by the university design team.' },
    { icon: CheckCircle, title: 'Student-Centric Support', desc: 'Hassle-free size replacement and campus pickup options.' },
  ];

  return (
    <div className="bg-[#F9FAFB] min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark-950 via-brand-dark-900 to-brand-dark-950 text-white border-b border-brand-dark-900 shadow-xl py-24 sm:py-32">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-brand-maroon-800/25 rounded-full blur-[140px] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-gold-600/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4" />
          <div className="absolute inset-0 opacity-[0.025] bg-[radial-gradient(#d4af37_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-7 animate-slideUp">
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-brand-gold-400 font-sans font-semibold text-xs tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Official GU Merchandise Hub
              </span>
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] sm:leading-[1.05]">
                Wear Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold-500 to-brand-gold-300">
                  Pride
                </span>
                .<br />
                Own Your Legacy.
              </h1>
              <p className="font-sans text-base sm:text-lg text-white/70 max-w-lg leading-relaxed">
                Premium campus apparel crafted for Geeta University students and faculty. Experience comfort, premium quality, and pride in every thread.
              </p>

              <div className="flex flex-wrap gap-4 pt-3">
                <Link to="/products" className="btn-gold px-8 py-3.5 text-sm shadow-[0_8px_24px_rgba(212,175,55,0.3)]">
                  Explore Catalog
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="px-8 py-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-all duration-300 backdrop-blur-md flex items-center gap-2"
                >
                  Join Member Club
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 hidden lg:block animate-fadeIn animate-float">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-brand-maroon-700/25 to-brand-gold-500/15 rounded-[32px] blur-2xl" />
                <div className="relative overflow-hidden rounded-[28px] bg-brand-dark-900 border border-white/10 aspect-[4/5] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                  <img
                    src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600"
                    alt="GU Varsity Hoodie"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 p-5 glass-panel-dark rounded-[20px] flex items-center justify-between border border-white/10 shadow-2xl">
                    <div>
                      <p className="font-display font-bold text-sm text-white">GU Varsity Hoodie</p>
                      <p className="font-sans text-xs text-brand-gold-400 mt-1">₹1,499 — Pure Cotton Fleece</p>
                    </div>
                    <Link to="/products" className="p-3 bg-brand-gold-500 text-brand-dark-950 rounded-xl hover:bg-brand-gold-400 transition-colors shadow-md">
                      <ShoppingBag className="w-4.5 h-4.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Assurances */}
      <section className="py-12 bg-white border-b border-brand-dark-100/60 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {assurances.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4.5 p-5.5 rounded-2xl hover:bg-brand-dark-50/60 border border-transparent hover:border-brand-dark-100/50 hover:scale-[1.01] hover:shadow-premium transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div className="p-3 bg-brand-maroon-50 text-brand-maroon-700 rounded-xl flex-shrink-0 shadow-[0_4px_10px_-2px_rgba(138,23,58,0.1)]">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-brand-dark-900 text-sm">{title}</h3>
                  <p className="font-sans text-xs text-brand-dark-500 mt-1.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading">Shop by Category</h2>
            <div className="w-12 h-0.5 bg-brand-gold-500 mx-auto mt-4 rounded-full" />
            <p className="section-subheading mx-auto">
              Browse student collections, accessories, and daily wear.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {categoryData.map((cat) => (
              <Link
                key={cat.slug}
                to={`/products?category=${cat.slug}`}
                className="group relative aspect-[3/4] rounded-[24px] overflow-hidden border border-brand-dark-100/60 hover:border-brand-maroon-200/40 hover:shadow-premium hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-750 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark-950/95 via-brand-dark-950/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <h3 className="font-display font-bold text-sm sm:text-base text-white group-hover:text-brand-gold-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="font-sans text-[11px] text-white/50 mt-1.5 hidden sm:block leading-relaxed">{cat.description}</p>
                  <div className="flex items-center gap-1.5 text-brand-gold-400 font-sans font-bold text-xs mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Browse <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="py-20 sm:py-24 bg-white border-y border-brand-dark-100/60 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.015)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="section-heading text-2xl sm:text-3xl">Trending Merchandise</h2>
              <p className="font-sans text-sm text-brand-dark-500 mt-2">
                Popular picks among students and faculty.
              </p>
            </div>
            <Link
              to="/products"
              className="hidden sm:flex items-center gap-1.5 font-sans font-bold text-sm text-brand-maroon-700 hover:text-brand-maroon-600 transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center sm:hidden mt-10">
            <Link to="/products" className="inline-flex items-center gap-1.5 font-sans font-bold text-sm text-brand-maroon-700">
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-r from-brand-maroon-800 via-brand-maroon-900 to-brand-maroon-800 border-y border-brand-maroon-950 shadow-2xl">
        <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
            Ready to Represent Geeta University?
          </h2>
          <p className="font-sans text-sm sm:text-base text-brand-maroon-100/90 max-w-xl mx-auto leading-relaxed">
            Get 10% off your first purchase with coupon code{' '}
            <strong className="text-brand-gold-300 font-bold border-b border-dashed border-brand-gold-450/40 px-1 py-0.5">
              WELCOME10
            </strong>{' '}
            at checkout.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white hover:bg-brand-gold-450 text-brand-maroon-950 font-sans font-bold rounded-2xl shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 text-sm"
          >
            Shop Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
