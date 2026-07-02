import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, Package, Truck, Compass, Check, ArrowRight, ShoppingBag } from 'lucide-react';
import { fetchOrderById } from '../features/orders/orderSlice';
import { useSocket } from '../hooks/useSocket';
import Loader from '../components/Loader';

const OrderConfirm = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  
  const { currentOrder: order, loading } = useSelector((state) => state.orders);
  const [localStatus, setLocalStatus] = useState('');

  // 1. Fetch Order on mount
  useEffect(() => {
    dispatch(fetchOrderById(orderId));
  }, [orderId, dispatch]);

  // Set initial status when order loads
  useEffect(() => {
    if (order) {
      setLocalStatus(order.status);
    }
  }, [order]);

  // 2. Connect mock websocket tracker
  useSocket(orderId, (update) => {
    setLocalStatus(update.status);
  });

  if (loading) return <Loader fullScreen />;

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h3 className="font-display font-bold text-xl text-brand-dark-900">Order Not Found</h3>
        <p className="font-sans text-brand-dark-500 mt-2">The order ID does not exist in our records.</p>
        <Link to="/products" className="btn-primary mt-6 inline-flex">Explore Shop</Link>
      </div>
    );
  }

  const steps = [
    { title: 'Placed', icon: ShoppingBag, desc: 'We have received your order details.' },
    { title: 'Packed', icon: Package, desc: 'Items are sorted and quality checked.' },
    { title: 'Shipped', icon: Truck, desc: 'Merch desk has prepared packages.' },
    { title: 'Delivered', icon: CheckCircle, desc: 'Package collected at Block A Desk.' }
  ];

  const getStepStatus = (stepTitle) => {
    const statuses = ['placed', 'packed', 'shipped', 'delivered'];
    const currentStatus = (localStatus || order.status || '').toLowerCase();
    const currentIdx = statuses.indexOf(currentStatus);
    const stepIdx = statuses.indexOf(stepTitle.toLowerCase());

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen text-left">
      {/* Success Hero Header */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 border-4 border-green-100 text-green-600 mb-2 animate-bounce">
          <Check className="w-10 h-10 stroke-[3]" />
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-dark-900 tracking-tight">
          Thank You For Your Order!
        </h1>
        <p className="font-sans text-sm text-brand-dark-500 max-w-md mx-auto leading-relaxed">
          Order <strong className="text-brand-dark-900 font-bold">{order._id}</strong> has been confirmed. You will receive a notification when it is ready for collection.
        </p>
      </div>

      {/* TRACKER PROGRESS BLOCK */}
      <div className="bg-white border border-brand-dark-100 rounded-3xl p-6 sm:p-8 shadow-premium mb-10 space-y-8">
        <div className="flex justify-between items-center border-b border-brand-dark-100 pb-4">
          <h2 className="font-display font-bold text-lg text-brand-dark-900">
            Realtime Order Tracker
          </h2>
          <span className="px-3 py-1 bg-brand-maroon-50 text-brand-maroon-800 font-sans font-bold text-xxs tracking-wider rounded-full border border-brand-maroon-150 uppercase animate-pulse">
            Live Updates Enabled
          </span>
        </div>

        {/* Visual Line Tracker */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((stepItem, idx) => {
            const status = getStepStatus(stepItem.title);
            const Icon = stepItem.icon;

            return (
              <div 
                key={idx}
                className={`p-4 border rounded-2xl flex flex-col gap-3 relative transition-all duration-300 ${
                  status === 'active' 
                    ? 'border-brand-maroon-700 bg-brand-maroon-50/10 ring-2 ring-brand-maroon-600/20' 
                    : status === 'completed'
                      ? 'border-brand-dark-200 bg-brand-dark-50/50 opacity-80'
                      : 'border-brand-dark-150 opacity-40'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className={`p-2 rounded-xl ${
                    status === 'active' 
                      ? 'bg-brand-maroon-700 text-white' 
                      : status === 'completed'
                        ? 'bg-green-700 text-white'
                        : 'bg-brand-dark-100 text-brand-dark-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {status === 'completed' && (
                    <span className="w-5 h-5 rounded-full bg-green-150 text-green-800 flex items-center justify-center text-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="text-left space-y-1">
                  <h4 className="font-display font-bold text-sm text-brand-dark-900">{stepItem.title}</h4>
                  <p className="font-sans text-[11px] text-brand-dark-500 leading-snug">{stepItem.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAILED SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* LEFT: ORDER SPECIFICATIONS (md:col-span-8) */}
        <div className="md:col-span-8 bg-white border border-brand-dark-100 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-base text-brand-dark-900 border-b border-brand-dark-100 pb-3">
            Items Purchased
          </h3>

          <div className="divide-y divide-brand-dark-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-4 flex gap-4 items-center">
                <div className="w-12 h-15 rounded-lg overflow-hidden border border-brand-dark-200 shrink-0 bg-brand-dark-50">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                  <h4 className="font-display font-bold text-sm text-brand-dark-900">{item.name}</h4>
                  <span className="font-sans text-xs text-brand-dark-500 font-semibold mt-0.5 block">
                    Size: {item.size} | Qty: {item.qty}
                  </span>
                </div>
                <span className="font-sans font-bold text-sm text-brand-dark-950">
                  ₹{(item.price * item.qty).toLocaleString('en-IN')}.00
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-start pt-6 border-t border-brand-dark-100 text-xs font-sans text-brand-dark-600 gap-6">
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-brand-dark-400">Collection Point</span>
              <p className="text-brand-dark-800 font-semibold leading-relaxed">
                Geeta University Store Counter<br />
                Block A Administrative Office, Panipat
              </p>
            </div>
            <div className="space-y-1 text-right">
              <span className="font-bold uppercase tracking-wider text-brand-dark-400">Payment Status</span>
              <p className="text-brand-dark-800 font-bold capitalize">
                {order.paymentMethod === 'stripe' ? (
                  <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">Paid (Stripe)</span>
                ) : (
                  <span className="text-brand-gold-800 bg-brand-gold-50 px-2 py-0.5 rounded border border-brand-gold-200">COD (Pending)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: COST BREAKDOWN SUMMARY (md:col-span-4) */}
        <div className="md:col-span-4 bg-white border border-brand-dark-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <h3 className="font-display font-bold text-base text-brand-dark-900 border-b border-brand-dark-100 pb-3">
            Payment Breakdown
          </h3>

          <div className="space-y-4 text-xs font-sans font-semibold text-brand-dark-600 flex-grow">
            <div className="flex justify-between">
              <span>Items Total</span>
              <span className="text-brand-dark-900">₹{order.subtotal?.toLocaleString('en-IN')}.00</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="text-brand-dark-900">
                {order.totalAmount - order.subtotal + (order.discount || 0) === 0 ? 'Free' : `₹${order.totalAmount - order.subtotal + (order.discount || 0)}.00`}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-700 font-bold">
                <span>Coupon Saved</span>
                <span>- ₹{order.discount?.toLocaleString('en-IN')}.00</span>
              </div>
            )}

            <hr className="border-brand-dark-100 my-4" />

            <div className="flex justify-between items-baseline">
              <span className="font-display font-bold text-sm text-brand-dark-900">Paid Amount</span>
              <span className="font-sans font-black text-xl text-brand-maroon-700">
                ₹{order.totalAmount?.toLocaleString('en-IN')}.00
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link to="/dashboard" className="w-full btn-primary py-3 text-sm font-semibold">
              View Order History
            </Link>
            <Link to="/products" className="w-full btn-secondary py-3 text-sm font-semibold">
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirm;
