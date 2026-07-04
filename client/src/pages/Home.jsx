import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, ShoppingBag, Award, Shield, CheckCircle } from 'lucide-react';
import { fetchProducts } from '../features/products/productSlice';
import ProductCard from '../components/ProductCard'; // We will create this component next
import Loader from '../components/Loader';

const Home = () => {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector((state) => state.products);

  useEffect(() => {
    // Fetch products on mount
    dispatch(fetchProducts({ limit: 4 }));
  }, [dispatch]);

  // Featured products
  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);

  const categories = [
    {
      name: 'Premium Hoodies',
      slug: 'hoodies',
      description: 'Heavyweight fleece hoodies with gold embroidery.',
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400',
      color: 'from-brand-maroon-700/80 to-brand-maroon-900/90',
    },
    {
      name: 'Heritage Tees',
      slug: 'tshirts',
      description: '100% combed cotton comfort wear.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400',
      color: 'from-brand-gold-600/80 to-brand-gold-800/90',
    },
    {
      name: 'Campus Sweatshirts',
      slug: 'sweatshirts',
      description: 'Minimalist classic crewnecks.',
      image: 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&q=80&w=400',
      color: 'from-brand-dark-700/80 to-brand-dark-900/90',
    },
    {
      name: 'Academic Accessories',
      slug: 'accessories',
      description: 'Leather journals, curved caps & thermal flasks.',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400',
      color: 'from-brand-maroon-900/80 to-brand-gold-950/90',
    },
  ];

  return (
    <div className="bg-brand-dark-50 min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-brand-dark-950 text-white py-24 sm:py-32">
        {/* Animated background gradient shapes */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-maroon-700 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-gold-600 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Diagonal architectural pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5c158_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col text info */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-maroon-800/40 border border-brand-maroon-600/30 text-brand-gold-400 font-sans font-semibold text-xs tracking-widest uppercase">
                Official GU Merchandise Hub
              </span>
              <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-white tracking-tight leading-none">
                Wear Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold-400 via-brand-gold-500 to-white animate-gradient">Pride</span>.
                <br />
                Own Your <span className="text-brand-maroon-400">Legacy</span>.
              </h1>
              <p className="font-sans text-base sm:text-lg text-brand-dark-300 max-w-xl leading-relaxed">
                Elevate your campus identity with Geeta University's premium apparel collection. Tailored for comfort, styled for distinction, engineered for academic excellence.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/products" className="btn-gold px-8 py-3.5 text-base">
                  Explore Catalog
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/register" className="btn-secondary bg-transparent hover:bg-white/5 border-white/20 text-white hover:border-white px-8 py-3.5 text-base">
                  Join Member Club
                </Link>
              </div>
            </div>

            {/* Right Col preview card */}
            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative p-2 bg-gradient-to-tr from-brand-maroon-800/20 to-brand-gold-500/20 rounded-3xl border border-white/10 shadow-2xl">
                <div className="overflow-hidden rounded-2xl bg-brand-dark-900 border border-white/5 relative aspect-square">
                  <img 
                    src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600" 
                    alt="GU Varsity Hoodie Preview" 
                    className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                  />
                  {/* University logo watermark */}
                  <div className="absolute top-4 left-4 z-10 w-18 h-18 pointer-events-none select-none">
                    <img 
                      src="/logo.png" 
                      alt="GU Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Floating badge */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 glass-panel-dark rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-base text-white">GU Varsity Hoodie</p>
                      <p className="font-sans text-xs text-brand-gold-400 font-semibold mt-0.5">₹1,499.00 — Pure Cotton Fleece</p>
                    </div>
                    <Link to="/products/prod_1" className="p-2.5 bg-brand-gold-500 text-brand-dark-950 rounded-lg hover:bg-brand-gold-400 transition-colors">
                      <ShoppingBag className="w-4.5 h-4.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE ASSURANCES */}
      <section className="py-12 bg-white border-b border-brand-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-maroon-50 text-brand-maroon-700 rounded-xl mt-1">
                <Award className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-brand-dark-900 text-base">Premium Craftsmanship</h3>
                <p className="font-sans text-sm text-brand-dark-500 mt-1">All fabrics are carefully selected to provide optimal wearability and shrinkage-free durability.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-maroon-50 text-brand-maroon-700 rounded-xl mt-1">
                <Shield className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-brand-dark-900 text-base">Official GU Identity</h3>
                <p className="font-sans text-sm text-brand-dark-500 mt-1">Authorized crest print and patterns verified by the Geeta University design division.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-maroon-50 text-brand-maroon-700 rounded-xl mt-1">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-brand-dark-900 text-base">Student-Centric Support</h3>
                <p className="font-sans text-sm text-brand-dark-500 mt-1">Hassle-free size replacement and pick-up options from your campus department.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="font-display font-bold text-3xl text-brand-dark-900 tracking-tight sm:text-4xl">
              Shop by Category
            </h2>
            <div className="w-16 h-1 bg-brand-gold-500 mx-auto mt-4 rounded-full"></div>
            <p className="font-sans text-brand-dark-500 mt-4">
              Browse through our customized student collections, accessory lines, and daily wear.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <Link 
                key={idx}
                to={`/products?category=${cat.slug}`}
                className="group relative h-80 rounded-2xl overflow-hidden shadow-premium hover:shadow-premium-hover transition-all duration-300 border border-brand-dark-100 flex items-end p-6"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  {/* Tint Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} mix-blend-multiply opacity-80 group-hover:opacity-75 transition-opacity`}></div>
                </div>

                {/* Content */}
                <div className="relative z-10 text-left space-y-1.5 w-full">
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-brand-gold-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="font-sans text-xs text-brand-dark-100 leading-snug">
                    {cat.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-brand-gold-400 font-sans font-semibold text-xs pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Browse Shop
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TRENDING ITEMS */}
      <section className="py-20 bg-white border-t border-b border-brand-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div className="text-left">
              <h2 className="font-display font-bold text-3xl text-brand-dark-900 tracking-tight sm:text-4xl">
                Trending Merchandise
              </h2>
              <p className="font-sans text-brand-dark-500 mt-2">
                Popular apparel choice among students and faculty members.
              </p>
            </div>
            <Link to="/products" className="hidden sm:flex items-center gap-1.5 font-sans font-semibold text-sm text-brand-maroon-700 hover:text-brand-maroon-600 transition-colors">
              View All Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center sm:hidden mt-8">
            <Link to="/products" className="inline-flex items-center gap-1.5 font-sans font-semibold text-sm text-brand-maroon-700 hover:text-brand-maroon-600">
              View All Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CAMPUS MOTIVATION BANNER */}
      <section className="py-24 relative overflow-hidden bg-brand-maroon-800 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:32px_32px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            Ready to Represent Geeta University?
          </h2>
          <p className="font-sans text-base sm:text-lg text-brand-maroon-100 max-w-2xl mx-auto">
            Get 10% off on your first purchase using coupon code <strong className="text-brand-gold-300 font-bold border-b border-dashed border-brand-gold-400 px-1">WELCOME10</strong> during checkout. Connect your campus credentials and start today!
          </p>
          <div className="pt-4">
            <Link to="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-brand-gold-400 active:bg-brand-gold-500 text-brand-maroon-900 font-sans font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              Shop Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
