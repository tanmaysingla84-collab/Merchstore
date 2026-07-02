import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { User, ShoppingBag, MapPin, Eye, Plus, Trash, Shield, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchUserOrders } from '../features/orders/orderSlice';
import { addAddress, logout } from '../features/auth/authSlice';
import Loader from '../components/Loader';

const UserDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { list: orders, loading: ordersLoading } = useSelector((state) => state.orders);

  const [activeTab, setActiveTab] = useState('orders'); // tabs: 'orders', 'addresses', 'profile'
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    dispatch(fetchUserOrders());
  }, [dispatch]);

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!street || !city || !stateName || !pincode) {
      toast.error('All address fields are required.');
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      toast.error('Pincode must be exactly 6 digits.');
      return;
    }

    dispatch(addAddress({
      street,
      city,
      state: stateName,
      pincode,
      isDefault: user?.addresses?.length === 0
    }))
      .unwrap()
      .then(() => {
        toast.success('Address added successfully');
        setStreet('');
        setCity('');
        setStateName('');
        setPincode('');
        setShowAddressForm(false);
      })
      .catch(() => {
        toast.error('Failed to save address');
      });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Placed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Packed': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Shipped': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Delivered': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-brand-dark-100 text-brand-dark-700 border-brand-dark-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen text-left">
      {/* Dashboard Welcome Header */}
      <div className="bg-white border border-brand-dark-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-maroon-700 text-white flex items-center justify-center font-display font-extrabold text-2xl shadow-premium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="space-y-1">
            <h1 className="font-display font-extrabold text-2xl text-brand-dark-900 leading-none">
              Welcome, {user?.name}
            </h1>
            <span className="font-sans text-xs text-brand-dark-500 font-semibold bg-brand-dark-50 border border-brand-dark-200 px-2 py-0.5 rounded capitalize">
              Role: {user?.role || 'Student'}
            </span>
          </div>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <Link to="/products" className="btn-secondary py-2.5 px-4 text-xs font-semibold flex-grow sm:flex-grow-0 text-center">
            Go Shopping
          </Link>
          <button 
            onClick={() => {
              dispatch(logout());
              toast.success('Logged out successfully');
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold transition-colors flex-grow sm:flex-grow-0"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* QUICK STATUS STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-brand-dark-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-brand-maroon-50 text-brand-maroon-700 rounded-xl">
            <ShoppingBag className="w-5.5 h-5.5" />
          </div>
          <div className="text-left">
            <span className="font-sans text-xs text-brand-dark-500 font-bold uppercase tracking-wider">Total Purchases</span>
            <p className="font-display font-extrabold text-xl text-brand-dark-950 mt-1">{orders.length} Orders</p>
          </div>
        </div>
        <div className="bg-white border border-brand-dark-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-brand-maroon-50 text-brand-maroon-700 rounded-xl">
            <MapPin className="w-5.5 h-5.5" />
          </div>
          <div className="text-left">
            <span className="font-sans text-xs text-brand-dark-500 font-bold uppercase tracking-wider">Saved Locations</span>
            <p className="font-display font-extrabold text-xl text-brand-dark-950 mt-1">{user?.addresses?.length || 0} Addresses</p>
          </div>
        </div>
        <div className="bg-white border border-brand-dark-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-brand-maroon-50 text-brand-maroon-700 rounded-xl">
            <Shield className="w-5.5 h-5.5" />
          </div>
          <div className="text-left">
            <span className="font-sans text-xs text-brand-dark-500 font-bold uppercase tracking-wider">Account Email</span>
            <p className="font-sans font-bold text-sm text-brand-dark-800 mt-1 truncate max-w-[200px]">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* TABS VIEWPORT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 bg-white border border-brand-dark-100 rounded-2xl p-4 shadow-sm h-fit">
          <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-thin">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-sans text-xs font-bold tracking-wider uppercase transition-colors shrink-0 text-left w-full ${
                activeTab === 'orders' 
                  ? 'bg-brand-maroon-700 text-white' 
                  : 'text-brand-dark-700 hover:bg-brand-maroon-50/50 hover:text-brand-maroon-700'
              }`}
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              Order History
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-sans text-xs font-bold tracking-wider uppercase transition-colors shrink-0 text-left w-full ${
                activeTab === 'addresses' 
                  ? 'bg-brand-maroon-700 text-white' 
                  : 'text-brand-dark-700 hover:bg-brand-maroon-50/50 hover:text-brand-maroon-700'
              }`}
            >
              <MapPin className="w-4.5 h-4.5" />
              Manage Locations
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-sans text-xs font-bold tracking-wider uppercase transition-colors shrink-0 text-left w-full ${
                activeTab === 'profile' 
                  ? 'bg-brand-maroon-700 text-white' 
                  : 'text-brand-dark-700 hover:bg-brand-maroon-50/50 hover:text-brand-maroon-700'
              }`}
            >
              <User className="w-4.5 h-4.5" />
              Member Profile
            </button>
          </div>
        </aside>

        {/* Tab Detail Viewport */}
        <main className="lg:col-span-3">
          {/* TAB 1: ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-brand-dark-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="font-display font-bold text-xl text-brand-dark-900 border-b border-brand-dark-100 pb-3">
                Your Purchases
              </h2>

              {ordersLoading ? (
                <Loader />
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-brand-dark-500 font-sans text-sm">
                  You haven't placed any merchandise orders yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div 
                      key={ord._id}
                      className="border border-brand-dark-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-brand-dark-350 transition-colors"
                    >
                      <div className="text-left space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-display font-extrabold text-sm text-brand-dark-900">
                            Order #{ord._id}
                          </span>
                          <span className={`px-2.5 py-0.5 border text-[10px] font-sans font-bold uppercase rounded-md ${getStatusColor(ord.status)}`}>
                            {ord.status}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-brand-dark-550 truncate max-w-sm">
                          {ord.items.map(i => `${i.name} (${i.size})`).join(', ')}
                        </p>
                        <p className="font-sans text-[11px] text-brand-dark-400">
                          Placed on: {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                        <span className="font-sans font-black text-base text-brand-dark-950">
                          ₹{ord.totalAmount?.toLocaleString('en-IN')}.00
                        </span>
                        
                        <Link 
                          to={`/order-confirm/${ord._id}`}
                          className="p-2.5 bg-brand-maroon-50 text-brand-maroon-700 hover:bg-brand-maroon-700 hover:text-white rounded-xl transition-all duration-200 border border-brand-maroon-100"
                          title="Track Live Order Status"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="bg-white border border-brand-dark-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-brand-dark-100 pb-3">
                <h2 className="font-display font-bold text-xl text-brand-dark-900">
                  Delivery Locations
                </h2>
                {!showAddressForm && (
                  <button 
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-maroon-700 text-white font-sans font-semibold text-xs rounded-xl shadow-sm hover:bg-brand-maroon-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New
                  </button>
                )}
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="border border-brand-dark-200 p-5 rounded-2xl bg-brand-dark-50 space-y-4 animate-fadeIn">
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-brand-dark-750">New Location Details</h3>
                  
                  {/* Street */}
                  <div>
                    <label className="block text-xxs font-bold text-brand-dark-700 uppercase tracking-wider mb-1">Address / Hostel / Room</label>
                    <input
                      type="text"
                      className="input-field text-xs py-2 px-3 bg-white"
                      placeholder="Room 408, Girls Hostel B, Geeta University"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* City */}
                    <div>
                      <label className="block text-xxs font-bold text-brand-dark-700 uppercase tracking-wider mb-1">City</label>
                      <input
                        type="text"
                        className="input-field text-xs py-2 px-3 bg-white"
                        placeholder="Panipat"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    {/* State */}
                    <div>
                      <label className="block text-xxs font-bold text-brand-dark-700 uppercase tracking-wider mb-1">State</label>
                      <input
                        type="text"
                        className="input-field text-xs py-2 px-3 bg-white"
                        placeholder="Haryana"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                      />
                    </div>
                    {/* Pincode */}
                    <div>
                      <label className="block text-xxs font-bold text-brand-dark-700 uppercase tracking-wider mb-1">Pincode</label>
                      <input
                        type="text"
                        className="input-field text-xs py-2 px-3 bg-white"
                        placeholder="132145"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="btn-secondary py-2 px-4 text-xs font-semibold bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary py-2 px-5 text-xs font-semibold"
                    >
                      Save Location
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Address Cards */}
              {user?.addresses?.length === 0 ? (
                <div className="text-center py-6 text-brand-dark-500 font-sans text-sm">
                  No addresses saved yet. Click Add New to save one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user?.addresses?.map((addr) => (
                    <div 
                      key={addr._id}
                      className="p-4 border border-brand-dark-250 rounded-2xl text-left space-y-2 relative"
                    >
                      <span className="font-sans font-bold text-sm text-brand-dark-900">
                        {addr.street.split(', ').pop() || 'Address'}
                      </span>
                      <p className="font-sans text-xs text-brand-dark-600 leading-relaxed">
                        {addr.street.split(',').slice(0, -1).join(',')}<br />
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      
                      {addr.isDefault && (
                        <span className="inline-block px-2 py-0.5 bg-brand-gold-100 border border-brand-gold-250 text-brand-gold-800 font-sans font-extrabold text-[8px] tracking-wider rounded uppercase mt-2">
                          Default Shipping
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEMBER PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-brand-dark-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="font-display font-bold text-xl text-brand-dark-900 border-b border-brand-dark-100 pb-3">
                Member Profile Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm font-sans text-brand-dark-600">
                <div className="space-y-1">
                  <span className="font-bold text-brand-dark-400 uppercase tracking-wider text-xxs block">Full Name</span>
                  <p className="text-brand-dark-900 font-semibold text-base">{user?.name}</p>
                </div>
                
                <div className="space-y-1">
                  <span className="font-bold text-brand-dark-400 uppercase tracking-wider text-xxs block">Email Address</span>
                  <p className="text-brand-dark-900 font-semibold text-base">{user?.email}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-brand-dark-400 uppercase tracking-wider text-xxs block">Account Status</span>
                  <p className="text-green-700 font-bold text-base flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-green-600 rounded-full inline-block animate-pulse"></span>
                    Verified GU Member
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-brand-dark-400 uppercase tracking-wider text-xxs block">Membership Access</span>
                  <p className="text-brand-dark-900 font-semibold text-base capitalize">{user?.role} Portal</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
