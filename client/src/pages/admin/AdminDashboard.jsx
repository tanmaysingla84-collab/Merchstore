import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  BarChart3, 
  ShoppingBag, 
  ClipboardList, 
  LogOut, 
  Menu, 
  X, 
  User, 
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  Store,
  Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logout } from '../../features/auth/authSlice';

import AdminAnalytics from './AdminAnalytics';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminUsers from './AdminUsers';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);

  const navigation = [
    { name: 'Command Center', href: '/admin/analytics', icon: BarChart3, desc: 'Revenue & insights' },
    { name: 'Product Catalog', href: '/admin/products', icon: ShoppingBag, desc: 'Add, edit, stock' },
    { name: 'Order Fulfillment', href: '/admin/orders', icon: ClipboardList, desc: 'Status & dispatch' },
    { name: 'Users Management', href: '/admin/users', icon: User, desc: 'Accounts & restrictions' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Admin logged out successfully');
    navigate('/');
  };

  const getActivePageName = () => {
    const activeNav = navigation.find((item) => location.pathname.startsWith(item.href));
    return activeNav ? activeNav.name : 'Admin Control Panel';
  };

  return (
    <div className="flex h-full min-h-0 bg-[#0a0a14] font-sans overflow-hidden">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-gradient-to-b from-[#12081a] to-[#0a0a14] text-white border-r border-[#d4af37]/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#9c2637] to-[#7b1c2e] shadow-lg shadow-[#9c2637]/30">
              <ShieldCheck className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <span className="font-display font-bold text-sm tracking-tight leading-none block text-white">GU Admin</span>
              <span className="font-display font-medium text-[10px] tracking-widest text-[#d4af37] uppercase">Control Panel</span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-white/40 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 border-b border-white/5 bg-[#d4af37]/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full border-2 border-[#d4af37]/40 bg-[#1a1028] flex items-center justify-center text-[#d4af37] font-display font-bold text-lg">
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-display font-bold text-sm text-white truncate">{user?.name || 'GU Admin'}</h4>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">Administrator</span>
              </div>
              <p className="text-[10px] text-white/40 truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Management</p>
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#9c2637] to-[#7b1c2e] text-white shadow-lg shadow-[#9c2637]/20 border border-[#d4af37]/20' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#d4af37]' : 'text-white/40 group-hover:text-white'}`} />
                  <div className="min-w-0">
                    <span className="font-medium text-sm block">{item.name}</span>
                    <span className={`text-[10px] block truncate ${isActive ? 'text-white/70' : 'text-white/30'}`}>{item.desc}</span>
                  </div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-[#d4af37] flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link
            to="/products"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-medium text-sm text-white/70 hover:text-white transition-all"
          >
            <Store className="w-4 h-4" />
            <span>View Public Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl bg-[#9c2637]/20 hover:bg-[#9c2637]/40 border border-[#9c2637]/30 font-medium text-sm text-red-200 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <header className="flex items-center justify-between h-20 px-6 lg:px-8 bg-[#12081a]/80 backdrop-blur-md border-b border-[#d4af37]/10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-white/60 hover:bg-white/5 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]/80 mb-0.5">Administrator Portal</p>
              <h1 className="font-display font-extrabold text-lg md:text-xl text-white tracking-tight my-0">
                {getActivePageName()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live Sync</span>
            </div>

            <div className="hidden md:flex flex-col text-right">
              <span className="font-display font-bold text-xs text-[#d4af37] uppercase tracking-widest">Geeta University</span>
              <span className="font-sans text-[10px] text-white/40">MerchStore Admin v1.0</span>
            </div>

            <div className="w-px h-8 bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <div className="w-7 h-7 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="font-sans text-xs font-semibold text-white/80 hidden md:block">
                {user?.name || 'Administrator'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-grow p-6 lg:p-8 overflow-y-auto bg-[#0a0a14]">
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#9c2637]/20 via-[#1a1028] to-[#d4af37]/10 border border-[#d4af37]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20">
                <Bell className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Changes you make here reflect on student & faculty dashboards</p>
                <p className="text-xs text-white/50 mt-0.5">Product updates sync to the store catalog. Order status changes notify customers in real-time.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#d4af37]">
              <GraduationCap className="w-3.5 h-3.5" />
              Admin Authority Active
            </div>
          </div>

          <Routes>
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="*" element={<Navigate to="analytics" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
