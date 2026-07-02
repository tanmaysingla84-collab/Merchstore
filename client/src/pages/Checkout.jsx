import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, CreditCard, ShoppingBag, MapPin, Tag, Landmark, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCart } from '../features/cart/cartSlice';
import { createOrder, validateCoupon, clearCoupon } from '../features/orders/orderSlice';
import { addAddress } from '../features/auth/authSlice';
import Loader from '../components/Loader';

// Address Validator Schema
const addressSchema = z.object({
  fullName: z.string().min(2, 'Full Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
});

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items: cartItems, loading: cartLoading } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { activeCoupon, couponError, loading: orderLoading } = useSelector((state) => state.orders);

  const [step, setStep] = useState(1); // Steps: 1 (Shipping), 2 (Payment), 3 (Review & Order)
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddressOpen, setNewAddressOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' or 'cod'
  const [couponCode, setCouponCode] = useState('');
  
  // Simulated Card Payment form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    dispatch(fetchCart());
    dispatch(clearCoupon());
  }, [dispatch]);

  // Set default address if available
  useEffect(() => {
    if (user?.addresses?.length > 0) {
      const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
      setSelectedAddressId(defaultAddr._id);
    } else {
      setNewAddressOpen(true);
    }
  }, [user]);

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product?.price || 0) * item.qty, 0);
  const delivery = subtotal > 1000 ? 0 : 60;
  const discount = activeCoupon ? Math.round(subtotal * (activeCoupon.discountPct / 100)) : 0;
  const total = subtotal + delivery - discount;

  // Safeguard redirect if cart empty
  if (!cartLoading && cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h3 className="font-display font-bold text-xl text-brand-dark-900">Your Cart is Empty</h3>
        <p className="font-sans text-brand-dark-500 mt-2">Add items to your cart before checking out.</p>
        <Link to="/products" className="btn-primary mt-6 inline-flex">Explore Products</Link>
      </div>
    );
  }

  // Address Submit handler
  const handleAddressSubmit = (data) => {
    // Dispatch to add address to user account profile
    dispatch(addAddress({
      street: `${data.street}, ${data.fullName} (Ph: ${data.phone})`,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      isDefault: user?.addresses?.length === 0 // Make default if it's the first address
    }))
      .unwrap()
      .then((res) => {
        toast.success('Address saved successfully');
        const newlyAdded = res.addresses[res.addresses.length - 1];
        setSelectedAddressId(newlyAdded._id);
        setNewAddressOpen(false);
        setStep(2); // Go to Payment step
      })
      .catch(() => {
        toast.error('Failed to save address');
      });
  };

  const handleUseSavedAddress = () => {
    if (!selectedAddressId) {
      toast.error('Please select an address or add a new one');
      return;
    }
    setStep(2); // Go to payment
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    dispatch(validateCoupon(couponCode))
      .unwrap()
      .then((res) => {
        toast.success(`Coupon applied! Saved ${res.discountPct}%`);
      })
      .catch((err) => {
        toast.error(err || 'Failed to apply coupon');
      });
  };

  const handlePlaceOrder = () => {
    // Get address text
    let finalAddressText = '';
    if (selectedAddressId) {
      const selected = user.addresses.find(a => a._id === selectedAddressId);
      if (selected) {
        finalAddressText = `${selected.street}, ${selected.city}, ${selected.state} - ${selected.pincode}`;
      }
    }

    if (!finalAddressText) {
      toast.error('Shipping address details missing.');
      return;
    }

    const orderPayload = {
      address: finalAddressText,
      paymentMethod,
      couponCode: activeCoupon?.code || null,
    };

    if (paymentMethod === 'stripe') {
      // Basic credit card validate mockup
      if (!cardNumber || !cardExpiry || !cardCvc) {
        toast.error('Please fill in your credit card billing details.');
        return;
      }
      setIsProcessingPayment(true);

      // Simulate Stripe 3D Secure network call
      setTimeout(() => {
        dispatch(createOrder(orderPayload))
          .unwrap()
          .then((res) => {
            setIsProcessingPayment(false);
            toast.success('Payment authorized! Order placed.');
            navigate(`/order-confirm/${res.order._id}`);
          })
          .catch((err) => {
            setIsProcessingPayment(false);
            toast.error(err || 'Order processing failed');
          });
      }, 1500);
    } else {
      // Cash on delivery path
      dispatch(createOrder(orderPayload))
        .unwrap()
        .then((res) => {
          toast.success('Order placed successfully (COD)');
          navigate(`/order-confirm/${res.order._id}`);
        })
        .catch((err) => {
          toast.error(err || 'Order processing failed');
        });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen text-left">
      {orderLoading && <Loader fullScreen />}

      {/* Progress Multi-step Tracker */}
      <div className="flex items-center justify-center max-w-lg mx-auto mb-12">
        <div className="flex items-center w-full">
          {/* Step 1 */}
          <div className="flex flex-col items-center relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-xs ${
              step >= 1 ? 'bg-brand-maroon-700 text-white' : 'bg-brand-dark-200 text-brand-dark-500'
            }`}>
              {step > 1 ? <Check className="w-4.5 h-4.5" /> : '1'}
            </div>
            <span className="font-sans text-xxs font-bold text-brand-dark-600 absolute -bottom-5 w-max">Shipping</span>
          </div>

          <div className={`flex-grow border-t-2 h-0.5 mx-2 ${step > 1 ? 'border-brand-maroon-700' : 'border-brand-dark-200'}`}></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-xs ${
              step >= 2 ? 'bg-brand-maroon-700 text-white' : 'bg-brand-dark-200 text-brand-dark-500'
            }`}>
              {step > 2 ? <Check className="w-4.5 h-4.5" /> : '2'}
            </div>
            <span className="font-sans text-xxs font-bold text-brand-dark-600 absolute -bottom-5 w-max">Payment</span>
          </div>

          <div className={`flex-grow border-t-2 h-0.5 mx-2 ${step > 2 ? 'border-brand-maroon-700' : 'border-brand-dark-200'}`}></div>

          {/* Step 3 */}
          <div className="flex flex-col items-center relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-xs ${
              step >= 3 ? 'bg-brand-maroon-700 text-white' : 'bg-brand-dark-200 text-brand-dark-500'
            }`}>
              3
            </div>
            <span className="font-sans text-xxs font-bold text-brand-dark-600 absolute -bottom-5 w-max">Review</span>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6">
        {/* LEFT COLUMN: ACTIVE STEP DETAILS (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: SHIPPING ADDRESS */}
          {step === 1 && (
            <div className="bg-white border border-brand-dark-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="font-display font-bold text-xl text-brand-dark-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-maroon-700" />
                Shipping Details
              </h2>

              {user?.addresses?.length > 0 && !newAddressOpen ? (
                /* Select Saved Address */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.addresses.map((addr) => (
                      <div 
                        key={addr._id}
                        onClick={() => setSelectedAddressId(addr._id)}
                        className={`p-4 border rounded-2xl cursor-pointer relative flex flex-col gap-2 transition-all ${
                          selectedAddressId === addr._id 
                            ? 'border-brand-maroon-700 bg-brand-maroon-50/10 ring-2 ring-brand-maroon-600/20' 
                            : 'border-brand-dark-200 hover:border-brand-dark-400'
                        }`}
                      >
                        {selectedAddressId === addr._id && (
                          <span className="absolute top-3 right-3 bg-brand-maroon-700 text-white p-0.5 rounded-full">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className="font-sans font-bold text-sm text-brand-dark-900">
                          {addr.street.split(', ').pop()}
                        </span>
                        <p className="font-sans text-xs text-brand-dark-600 leading-relaxed">
                          {addr.street.split(',').slice(0, -1).join(',')}<br />
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        {addr.isDefault && (
                          <span className="mt-auto pt-1 font-sans text-[9px] font-extrabold tracking-wider text-brand-gold-600 uppercase">
                            Default Address
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={() => {
                        setNewAddressOpen(true);
                        reset();
                      }}
                      className="btn-secondary py-2.5 text-xs font-semibold"
                    >
                      Add New Address
                    </button>
                    <button
                      onClick={handleUseSavedAddress}
                      className="btn-primary py-2.5 px-6 text-xs font-semibold"
                    >
                      Deliver to Selected Address
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* New Address entry form */
                <form onSubmit={handleSubmit(handleAddressSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-brand-dark-700 uppercase tracking-wider mb-1.5">
                        Consignee Name
                      </label>
                      <input
                        type="text"
                        className={`input-field text-sm py-2.5 ${errors.fullName ? 'border-red-400' : ''}`}
                        placeholder="Aditya Verma"
                        {...register('fullName')}
                      />
                      {errors.fullName && (
                        <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-brand-dark-700 uppercase tracking-wider mb-1.5">
                        Contact Phone Number
                      </label>
                      <input
                        type="tel"
                        className={`input-field text-sm py-2.5 ${errors.phone ? 'border-red-400' : ''}`}
                        placeholder="9876543210"
                        {...register('phone')}
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Street Address */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark-700 uppercase tracking-wider mb-1.5">
                      Hostel / Department Room / Street Address
                    </label>
                    <input
                      type="text"
                      className={`input-field text-sm py-2.5 ${errors.street ? 'border-red-400' : ''}`}
                      placeholder="Room 105, Boys Hostel C, Geeta University"
                      {...register('street')}
                    />
                    {errors.street && (
                      <p className="text-xs text-red-500 mt-1">{errors.street.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* City */}
                    <div>
                      <label className="block text-xs font-bold text-brand-dark-700 uppercase tracking-wider mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        className={`input-field text-sm py-2.5 ${errors.city ? 'border-red-400' : ''}`}
                        placeholder="Panipat"
                        {...register('city')}
                      />
                      {errors.city && (
                        <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
                      )}
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-xs font-bold text-brand-dark-700 uppercase tracking-wider mb-1.5">
                        State
                      </label>
                      <input
                        type="text"
                        className={`input-field text-sm py-2.5 ${errors.state ? 'border-red-400' : ''}`}
                        placeholder="Haryana"
                        {...register('state')}
                      />
                      {errors.state && (
                        <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>
                      )}
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="block text-xs font-bold text-brand-dark-700 uppercase tracking-wider mb-1.5">
                        Pincode
                      </label>
                      <input
                        type="text"
                        className={`input-field text-sm py-2.5 ${errors.pincode ? 'border-red-400' : ''}`}
                        placeholder="132145"
                        {...register('pincode')}
                      />
                      {errors.pincode && (
                        <p className="text-xs text-red-500 mt-1">{errors.pincode.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    {user?.addresses?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNewAddressOpen(false)}
                        className="btn-secondary py-2.5 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn-primary py-2.5 px-6 text-xs font-semibold"
                    >
                      Save & Proceed
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {step === 2 && (
            <div className="bg-white border border-brand-dark-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="font-display font-bold text-xl text-brand-dark-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-maroon-700" />
                Select Payment Mode
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stripe Credit Card selection */}
                <div 
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-5 border rounded-2xl cursor-pointer flex items-start gap-4 transition-all ${
                    paymentMethod === 'stripe' 
                      ? 'border-brand-maroon-700 bg-brand-maroon-50/10 ring-2 ring-brand-maroon-600/20' 
                      : 'border-brand-dark-200 hover:border-brand-dark-400'
                  }`}
                >
                  <div className="p-2.5 bg-brand-maroon-50 text-brand-maroon-700 rounded-xl mt-0.5">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-display font-bold text-sm text-brand-dark-900">Online Card (Stripe)</h3>
                    <p className="font-sans text-xs text-brand-dark-500 mt-1">Instant secure authorization via credit/debit card.</p>
                  </div>
                </div>

                {/* COD selection */}
                <div 
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-5 border rounded-2xl cursor-pointer flex items-start gap-4 transition-all ${
                    paymentMethod === 'cod' 
                      ? 'border-brand-maroon-700 bg-brand-maroon-50/10 ring-2 ring-brand-maroon-600/20' 
                      : 'border-brand-dark-200 hover:border-brand-dark-400'
                  }`}
                >
                  <div className="p-2.5 bg-brand-maroon-50 text-brand-maroon-700 rounded-xl mt-0.5">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-display font-bold text-sm text-brand-dark-900">Cash on Collection (COD)</h3>
                    <p className="font-sans text-xs text-brand-dark-500 mt-1">Pay when collecting merchandise at the Campus counter.</p>
                  </div>
                </div>
              </div>

              {/* Stripe Payment Card Form Mockup */}
              {paymentMethod === 'stripe' && (
                <div className="border border-brand-dark-200 rounded-2xl p-5 bg-brand-dark-50 space-y-4 max-w-md animate-fadeIn">
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-brand-dark-700">
                    Card Information
                  </h4>
                  
                  {/* Card number */}
                  <div className="relative">
                    <input
                      type="text"
                      maxLength="19"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                      className="input-field text-sm py-2.5"
                      placeholder="Card Number (4242 4242 4242 4242)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Expiry */}
                    <input
                      type="text"
                      maxLength="5"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="input-field text-sm py-2.5"
                      placeholder="MM/YY"
                    />
                    {/* CVC */}
                    <input
                      type="password"
                      maxLength="3"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="input-field text-sm py-2.5"
                      placeholder="CVC"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary py-2.5 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn-primary py-2.5 px-6 text-xs font-semibold"
                >
                  Continue to Review
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW ORDER DETAILS */}
          {step === 3 && (
            <div className="bg-white border border-brand-dark-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="font-display font-bold text-xl text-brand-dark-900 flex items-center gap-2">
                <Check className="w-5 h-5 text-brand-maroon-700" />
                Review Your Order
              </h2>

              <div className="border border-brand-dark-200 rounded-2xl divide-y divide-brand-dark-200 overflow-hidden bg-brand-dark-50/50">
                {/* Shipping summary */}
                <div className="p-4 flex justify-between gap-4 text-xs font-sans">
                  <div className="text-left space-y-1">
                    <span className="font-bold uppercase tracking-wider text-brand-dark-500">Shipping To</span>
                    <p className="text-brand-dark-800 font-semibold leading-relaxed">
                      {user.addresses.find(a => a._id === selectedAddressId) ? (
                        <>
                          {user.addresses.find(a => a._id === selectedAddressId).street}<br />
                          {user.addresses.find(a => a._id === selectedAddressId).city}, {user.addresses.find(a => a._id === selectedAddressId).state} - {user.addresses.find(a => a._id === selectedAddressId).pincode}
                        </>
                      ) : 'Please fill details'}
                    </p>
                  </div>
                  <button onClick={() => setStep(1)} className="font-bold text-brand-maroon-700 hover:text-brand-maroon-600 h-fit">Edit</button>
                </div>

                {/* Payment summary */}
                <div className="p-4 flex justify-between gap-4 text-xs font-sans">
                  <div className="text-left space-y-1">
                    <span className="font-bold uppercase tracking-wider text-brand-dark-500">Payment Mode</span>
                    <p className="text-brand-dark-800 font-semibold capitalize">
                      {paymentMethod === 'stripe' ? 'Online Card (Stripe)' : 'Cash on Collection (COD)'}
                    </p>
                  </div>
                  <button onClick={() => setStep(2)} className="font-bold text-brand-maroon-700 hover:text-brand-maroon-600 h-fit">Edit</button>
                </div>
              </div>

              {/* Items checklist */}
              <div className="space-y-4">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-brand-dark-750">Items List</h3>
                <div className="divide-y divide-brand-dark-100">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center text-sm font-sans">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-brand-dark-900">{item.product?.name}</span>
                        <span className="text-xs text-brand-dark-500">({item.size})</span>
                      </div>
                      <span className="font-semibold text-brand-dark-600">
                        {item.qty} × ₹{item.product?.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-brand-dark-100">
                <button
                  onClick={() => setStep(2)}
                  className="btn-secondary py-2.5 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessingPayment}
                  className="btn-primary py-3 px-8 text-sm font-semibold flex-grow max-w-sm"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authorizing Payment Card...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Authorize & Place Order (₹{total.toLocaleString('en-IN')}.00)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ORDER TOTAL SUMMARY PANEL (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Coupon Input */}
          <div className="bg-white border border-brand-dark-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-brand-dark-900 flex items-center gap-2">
              <Tag className="w-4.5 h-4.5 text-brand-maroon-700" />
              Apply Coupon Code
            </h3>
            
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                className="input-field text-xs py-2 px-3 flex-grow"
                placeholder="WELCOME10"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
              <button
                type="submit"
                className="btn-primary px-4 py-2 text-xs font-semibold shrink-0"
              >
                Apply
              </button>
            </form>
            
            {activeCoupon && (
              <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-semibold">
                <span>Code Applied: {activeCoupon.code}</span>
                <button 
                  onClick={() => {
                    dispatch(clearCoupon());
                    setCouponCode('');
                  }}
                  className="text-green-700 hover:text-green-600 uppercase font-black text-xxs"
                >
                  Remove
                </button>
              </div>
            )}
            
            {couponError && (
              <p className="text-xxs text-red-500 font-bold">{couponError}</p>
            )}
          </div>

          {/* Pricing Totals */}
          <div className="bg-white border border-brand-dark-100 rounded-3xl p-6 shadow-premium space-y-5">
            <h3 className="font-display font-bold text-base text-brand-dark-900 border-b border-brand-dark-100 pb-3">
              Order Breakdown
            </h3>

            <div className="space-y-3.5 text-xs font-sans font-semibold text-brand-dark-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="text-brand-dark-900">₹{subtotal.toLocaleString('en-IN')}.00</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="text-brand-dark-900">
                  {delivery === 0 ? 'Free' : `₹${delivery}.00`}
                </span>
              </div>
              {activeCoupon && (
                <div className="flex justify-between text-green-700 font-bold">
                  <span>Coupon Discount ({activeCoupon.discountPct}%)</span>
                  <span>- ₹{discount.toLocaleString('en-IN')}.00</span>
                </div>
              )}
            </div>

            <hr className="border-brand-dark-100" />

            <div className="flex justify-between items-baseline">
              <span className="font-display font-bold text-sm text-brand-dark-900">Total Payable</span>
              <span className="font-sans font-black text-xl text-brand-maroon-700">
                ₹{total.toLocaleString('en-IN')}.00
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
