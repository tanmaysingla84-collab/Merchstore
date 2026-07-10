import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Truck, 
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAdminOrders, updateAdminOrderStatus, updateAdminOrderPaymentStatus, updateOrderStatusSocket } from '../../features/admin/adminSlice';
import { useAdminSocket } from '../../hooks/useAdminSocket';

const AdminOrders = () => {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.admin);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  
  // Expanded Order details index
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [dispatch, statusFilter, paymentFilter]);

  const handleSocketStatusUpdate = useCallback((payload) => {
    dispatch(updateOrderStatusSocket({
      orderId: payload.orderId,
      status: payload.status,
    }));
  }, [dispatch]);

  useAdminSocket(handleSocketStatusUpdate);

  const loadOrders = () => {
    dispatch(fetchAdminOrders({
      limit: 100,
      status: statusFilter || undefined,
      paymentMethod: paymentFilter || undefined,
      search: searchTerm.trim() || undefined,
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOrders();
  };

  const handleStatusChange = (orderId, newStatus) => {
    dispatch(updateAdminOrderStatus({ 
      id: orderId, 
      status: newStatus,
      note: `Status updated by Admin to ${newStatus}` 
    }))
      .unwrap()
      .then((res) => {
        toast.success(res.message || `Order status updated to ${newStatus}!`);
        loadOrders();
      })
      .catch((err) => {
        toast.error(err || 'Failed to update order status');
      });
  };

  const handlePaymentStatusChange = (orderId, newPaymentStatus) => {
    dispatch(updateAdminOrderPaymentStatus({ 
      id: orderId, 
      paymentStatus: newPaymentStatus
    }))
      .unwrap()
      .then((res) => {
        toast.success(res.message || `Payment status updated to ${newPaymentStatus}!`);
        loadOrders();
      })
      .catch((err) => {
        toast.error(err || 'Failed to update payment status');
      });
  };

  const toggleExpandOrder = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'packed':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'shipped':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };


  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search and Filters */}
      <div className="bg-white p-5 rounded-2xl border border-brand-dark-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96 flex">
          <input
            type="text"
            className="input-field py-2 pl-10 pr-4 text-xs font-sans"
            placeholder="Search by Order ID or User name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 text-brand-dark-400 absolute left-3.5 top-3" />
          <button 
            type="submit" 
            className="ml-2 btn-secondary py-2 px-4 text-xs font-bold bg-brand-dark-50 border border-brand-dark-200"
          >
            Search
          </button>
        </form>

        {/* Filters Select */}
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          {/* Status Filter */}
          <select
            className="input-field py-2 px-3 text-xs bg-white border-brand-dark-200 w-full sm:w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Method Filter */}
          <select
            className="input-field py-2 px-3 text-xs bg-white border-brand-dark-200 w-full sm:w-40"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">All Payments</option>
            <option value="stripe">Stripe Card</option>
            <option value="cod">Cash on Delivery</option>
            <option value="upi">UPI Transfer</option>
          </select>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-2xl border border-brand-dark-100 shadow-premium overflow-hidden">
        {loading.orders ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-brand-maroon-700 animate-spin" />
            <span className="text-xs font-sans text-brand-dark-400 font-semibold">Updating orders list...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-brand-dark-500 font-sans text-sm">
            No orders match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-dark-50/50 border-b border-brand-dark-100 text-brand-dark-500 font-sans text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Order Date</th>
                  <th className="py-4 px-6">Total Amount</th>
                  <th className="py-4 px-6">Order Status</th>
                  <th className="py-4 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark-100 font-sans text-xs">
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order._id;
                  return (
                    <React.Fragment key={order._id}>
                      <tr className={`hover:bg-brand-dark-50/20 transition-colors ${isExpanded ? 'bg-brand-dark-50/20' : ''}`}>
                        {/* Order ID */}
                        <td className="py-4 px-6 font-mono font-bold text-brand-dark-900 truncate max-w-[120px]">
                          #{order._id}
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-6 font-bold text-brand-dark-800">
                          {order.userId?.name || 'Guest User'}
                          <span className="block text-[10px] text-brand-dark-400 font-normal font-sans mt-0.5">
                            {order.userId?.email || 'N/A'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-6 text-brand-dark-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-brand-dark-400" />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="py-4 px-6">
                          <span className="font-bold text-brand-dark-900">₹{order.finalAmount}</span>
                          <span className="block text-[10px] text-brand-dark-400 uppercase font-semibold mt-0.5">
                            {order.paymentMethod === 'stripe' ? 'Stripe Card' : order.paymentMethod.toUpperCase()}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          {['delivered', 'cancelled'].includes(order.status) ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide capitalize ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          ) : (
                            <select
                              className={`px-2 py-1 bg-white border rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-maroon-500 capitalize cursor-pointer ${getStatusColor(order.status)}`}
                              value={order.status}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            >
                              <option value="placed">Placed</option>
                              <option value="packed">Packed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          )}
                        </td>

                        {/* Action Details Toggle */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => toggleExpandOrder(order._id)}
                            className="p-1.5 rounded-xl text-brand-dark-500 hover:bg-brand-dark-100 hover:text-brand-dark-900 transition-colors inline-flex items-center gap-1 font-semibold"
                          >
                            <span>View</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="6" className="bg-brand-dark-50/40 px-6 py-6 border-b border-brand-dark-100">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-xs">
                              {/* Left col: Ordered items */}
                              <div className="bg-white p-5 rounded-2xl border border-brand-dark-100 shadow-sm space-y-3.5 lg:col-span-2">
                                <h4 className="font-display font-bold text-sm text-brand-dark-900 flex items-center gap-2 border-b border-brand-dark-100 pb-2.5">
                                  <span>Ordered Items ({order.items?.length || 0})</span>
                                </h4>
                                <div className="divide-y divide-brand-dark-100">
                                  {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                                      <div className="flex items-center gap-3">
                                        {item.image && (
                                          <div className="w-9 h-9 border border-brand-dark-100 rounded-lg overflow-hidden flex-shrink-0 bg-brand-dark-50">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <h5 className="font-sans font-bold text-brand-dark-900 truncate max-w-[200px]">
                                            {item.name}
                                          </h5>
                                          <span className="text-[10px] text-brand-dark-400 font-medium">
                                            Size: {item.size} | Qty: {item.qty}
                                          </span>
                                        </div>
                                      </div>
                                      <span className="font-bold text-brand-dark-900">₹{item.price * item.qty}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="border-t border-brand-dark-100 pt-3 flex flex-col gap-1.5 text-right font-sans">
                                  <div className="flex justify-between text-brand-dark-500 text-[11px]">
                                    <span>Subtotal:</span>
                                    <span>₹{order.totalAmount}</span>
                                  </div>
                                  {order.discountAmount > 0 && (
                                    <div className="flex justify-between text-brand-maroon-700 text-[11px] font-semibold">
                                      <span>Discount (Coupon: {order.couponCode}):</span>
                                      <span>-₹{order.discountAmount}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-brand-dark-900 font-bold text-sm border-t border-brand-dark-100 pt-1.5 mt-1.5">
                                    <span>Grand Total:</span>
                                    <span>₹{order.finalAmount}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right col: Shipping & Payment Meta */}
                              <div className="bg-white p-5 rounded-2xl border border-brand-dark-100 shadow-sm space-y-4">
                                <h4 className="font-display font-bold text-sm text-brand-dark-900 border-b border-brand-dark-100 pb-2.5">
                                  Shipping & Transactions
                                </h4>
                                
                                {/* Address */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-brand-dark-400 font-bold text-[10px] uppercase tracking-wider">
                                    <MapPin className="w-3.5 h-3.5 text-brand-maroon-700" />
                                    <span>Delivery Address</span>
                                  </div>
                                  <div className="font-sans text-brand-dark-600 pl-5 leading-normal space-y-0.5">
                                    <p className="font-bold text-brand-dark-800">{order.address?.fullName || order.userId?.name}</p>
                                    <p>{order.address?.street}</p>
                                    <p>{order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
                                    <p className="text-[10px] mt-1 text-brand-dark-500">Contact: {order.address?.phone || order.userId?.phone || 'N/A'}</p>
                                  </div>
                                </div>

                                {/* Transaction Meta */}
                                <div className="space-y-1.5 border-t border-brand-dark-100 pt-3.5">
                                  <div className="flex items-center gap-1.5 text-brand-dark-400 font-bold text-[10px] uppercase tracking-wider">
                                    <CreditCard className="w-3.5 h-3.5 text-brand-gold-500" />
                                    <span>Transaction details</span>
                                  </div>
                                  <div className="font-sans text-brand-dark-600 pl-5 space-y-1">
                                    <div className="flex justify-between items-center py-1">
                                      <span>Payment status:</span>
                                      <select
                                        className={`px-2 py-0.5 bg-white border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-maroon-500 capitalize cursor-pointer ${
                                          order.paymentStatus === 'paid' ? 'text-emerald-600 border-emerald-250' :
                                          order.paymentStatus === 'failed' ? 'text-rose-600 border-rose-250' :
                                          'text-amber-600 border-amber-250'
                                        }`}
                                        value={order.paymentStatus}
                                        onChange={(e) => handlePaymentStatusChange(order._id, e.target.value)}
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                        <option value="refunded">Refunded</option>
                                      </select>
                                    </div>
                                    {order.stripePaymentIntentId && (
                                      <div className="text-[10px]">
                                        <span className="block text-brand-dark-400">Stripe Intent ID:</span>
                                        <span className="font-mono font-bold text-brand-dark-700 break-all">{order.stripePaymentIntentId}</span>
                                      </div>
                                    )}
                                    {order.upiTxnId && (
                                      <div className="text-[10px]">
                                        <span className="block text-brand-dark-400">UPI Ref / Txn ID:</span>
                                        <span className="font-mono font-bold text-brand-dark-700">{order.upiTxnId}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* History Timeline */}
                                <div className="space-y-2 border-t border-brand-dark-100 pt-3.5">
                                  <div className="flex items-center gap-1.5 text-brand-dark-400 font-bold text-[10px] uppercase tracking-wider">
                                    <Truck className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Status Timeline</span>
                                  </div>
                                  <div className="pl-5 space-y-2 relative border-l border-brand-dark-100 ml-1.5 pt-1">
                                    {order.statusHistory?.map((hist, hIdx) => (
                                      <div key={hIdx} className="relative pl-4 text-[10px] leading-relaxed">
                                        <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full border bg-white border-brand-dark-350" />
                                        <p className="font-bold text-brand-dark-800 capitalize leading-none mb-0.5">{hist.status}</p>
                                        <p className="text-[9px] text-brand-dark-400">{formatDate(hist.timestamp)}</p>
                                        {hist.note && <p className="text-brand-dark-500 italic mt-0.5 font-sans">"{hist.note}"</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
