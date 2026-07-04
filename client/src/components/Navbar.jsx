import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingBag, User, LogOut, LayoutDashboard, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchCart } from '../features/cart/cartSlice';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isLoggedIn, user, logout } = useAuth();
  const cartItems = useSelector((state) => state.cart.items);
  
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Calculate total quantity of items in cart
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchCart());
    }
  }, [isLoggedIn, dispatch]);

  // Close menus on page navigation
  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-brand-dark-100 shadow-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              {/* Gold seal emblem */}
              <div className="w-20 h-20 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                <img 
                  src="/logo.png" 
                  alt="Geeta University Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl text-brand-maroon-700 leading-none tracking-tight group-hover:text-brand-maroon-600 transition-colors">
                  GEETA UNIVERSITY
                </span>
                <span className="font-sans font-medium text-[10px] text-brand-gold-600 uppercase tracking-widest leading-none mt-1">
                  Merchandise Store
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`font-sans font-medium text-sm transition-colors ${
                isActive('/') ? 'text-brand-maroon-700 font-semibold border-b-2 border-brand-maroon-700 py-1' : 'text-brand-dark-600 hover:text-brand-maroon-700'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className={`font-sans font-medium text-sm transition-colors ${
                isActive('/products') ? 'text-brand-maroon-700 font-semibold border-b-2 border-brand-maroon-700 py-1' : 'text-brand-dark-600 hover:text-brand-maroon-700'
              }`}
            >
              Catalog
            </Link>
          </div>

          {/* Action Icons */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Cart Icon */}
            <Link to="/cart" className="relative p-2.5 text-brand-dark-700 hover:text-brand-maroon-700 hover:bg-brand-maroon-50 rounded-xl transition-all duration-200">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-gold-500 text-brand-dark-950 font-sans font-bold text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account actions */}
            {isLoggedIn ? (
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 text-brand-dark-800 hover:text-brand-maroon-700 hover:bg-brand-maroon-50 rounded-xl border border-brand-dark-200 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-maroon-100 text-brand-maroon-800 flex items-center justify-center font-display font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="font-sans font-medium text-sm">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown className="w-4 h-4 text-brand-dark-500" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-brand-dark-100 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-brand-dark-100">
                      <p className="font-display font-semibold text-sm text-brand-dark-900 truncate">{user?.name}</p>
                      <p className="font-sans text-xs text-brand-dark-500 truncate">{user?.email}</p>
                    </div>
                    <Link 
                      to="/dashboard" 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-brand-dark-700 hover:bg-brand-maroon-50 hover:text-brand-maroon-700 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button 
                      onClick={handleLogoutClick}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="px-4.5 py-2 text-sm font-semibold text-brand-maroon-700 hover:text-brand-maroon-600 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-5 py-2 bg-brand-maroon-700 text-white rounded-xl text-sm font-semibold shadow-premium hover:bg-brand-maroon-600 transition-all duration-300">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex items-center md:hidden gap-4">
            <Link to="/cart" className="relative p-2 text-brand-dark-700 hover:text-brand-maroon-700 rounded-lg">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-gold-500 text-brand-dark-950 font-sans font-bold text-xxs w-4.5 h-4.5 flex items-center justify-center rounded-full shadow">
                  {cartCount}
                </span>
              )}
            </Link>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-brand-dark-700 hover:text-brand-maroon-700 hover:bg-brand-dark-100 transition-all duration-200"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-brand-dark-100 bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <Link 
            to="/" 
            className={`block px-3 py-2.5 rounded-xl font-sans font-medium text-base ${
              isActive('/') ? 'bg-brand-maroon-50 text-brand-maroon-700 font-semibold' : 'text-brand-dark-700 hover:bg-brand-dark-50'
            }`}
          >
            Home
          </Link>
          <Link 
            to="/products" 
            className={`block px-3 py-2.5 rounded-xl font-sans font-medium text-base ${
              isActive('/products') ? 'bg-brand-maroon-50 text-brand-maroon-700 font-semibold' : 'text-brand-dark-700 hover:bg-brand-dark-50'
            }`}
          >
            Catalog
          </Link>

          <hr className="border-brand-dark-100 my-2" />

          {isLoggedIn ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 rounded-lg bg-brand-maroon-100 text-brand-maroon-800 flex items-center justify-center font-display font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-sm text-brand-dark-900 leading-none">{user?.name}</span>
                  <span className="font-sans text-xs text-brand-dark-500 leading-none mt-1">{user?.email}</span>
                </div>
              </div>
              <Link 
                to="/dashboard" 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans font-medium text-brand-dark-700 hover:bg-brand-dark-50"
              >
                <LayoutDashboard className="w-5 h-5 text-brand-dark-500" />
                Dashboard
              </Link>
              <button 
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans font-medium text-red-600 hover:bg-red-50 text-left"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2 pt-2 px-3">
              <Link to="/login" className="w-full text-center py-2.5 border border-brand-maroon-700 text-brand-maroon-700 rounded-xl font-semibold hover:bg-brand-maroon-50 transition-colors">
                Login
              </Link>
              <Link to="/register" className="w-full text-center py-2.5 bg-brand-maroon-700 text-white rounded-xl font-semibold shadow-premium hover:bg-brand-maroon-600 transition-colors">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
