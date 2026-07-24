// ─── pages/OrderReceipt.jsx ───────────────────────────────────────────────────
// Dedicated receipt page — mirrors the email HTML design
// Route: /order/:orderId/receipt  (ProtectedRoute)

import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById } from '../features/orders/orderSlice';
import Loader from '../components/Loader';
import { Download, ArrowLeft, CheckCircle } from 'lucide-react';

const OrderReceipt = () => {
  const { orderId } = useParams();
  const dispatch    = useDispatch();
  const { currentOrder: order, loading } = useSelector(s => s.orders);
  const printRef    = useRef(null);

  useEffect(() => {
    dispatch(fetchOrderById(orderId));
  }, [orderId, dispatch]);

  const handleDownloadPDF = () => {
    window.print();
  };

  if (loading) return <Loader fullScreen />;

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h2 className="font-display font-bold text-2xl text-brand-dark-900 mb-3">Receipt Not Found</h2>
        <p className="text-brand-dark-500 mb-6">The order ID does not exist or you don't have access.</p>
        <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
      </div>
    );
  }

  const subtotal   = Number(order.totalAmount   || 0);
  const discount   = Number(order.discountAmount || 0);
  const finalAmt   = Number(order.finalAmount   || subtotal);
  const shipping   = Math.max(0, finalAmt - subtotal + discount);
  const addr       = order.address || {};
  const shortId    = order._id.toString().slice(-10).toUpperCase();
  const dateStr    = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const payLabel = {
    stripe: 'Card (Stripe)',
    upi:    'UPI',
    cod:    'Cash on Delivery',
  }[order.paymentMethod] || order.paymentMethod?.toUpperCase();

  return (
    <>
      {/* ── Print-only styles ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .receipt-shell {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* ── Action Bar (hidden on print) ── */}
      <div className="no-print bg-white border-b border-brand-dark-100 py-3 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <Link
          to={`/order-confirm/${orderId}`}
          className="flex items-center gap-2 text-sm font-semibold text-brand-dark-600 hover:text-brand-dark-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Order
        </Link>
        <button
          onClick={handleDownloadPDF}
          id="download-pdf-btn"
          className="flex items-center gap-2 px-5 py-2 bg-[#6b1414] hover:bg-[#591010] text-white text-sm font-bold rounded-xl transition-all shadow-md"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {/* ── Receipt Container ── */}
      <div className="bg-slate-100 min-h-screen py-10 px-4">
        <div
          ref={printRef}
          className="receipt-shell bg-white rounded-2xl shadow-xl overflow-hidden max-w-3xl mx-auto"
          style={{ fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif" }}
        >

          {/* ══ HEADER ══ */}
          <div style={{ background: 'linear-gradient(135deg,#6b1414 0%,#9b1c1c 60%,#7c2d12 100%)', padding: '32px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Logo + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src="/logo.png"
                  alt="Geeta University"
                  style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                    Geeta University
                  </div>
                  <div style={{ color: '#fca5a5', fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
                    Merchandise Store
                  </div>
                </div>
              </div>

              {/* Receipt Label */}
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 10,
                padding: '10px 18px',
                textAlign: 'right',
              }}>
                <div style={{ color: '#fecaca', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  OFFICIAL RECEIPT
                </div>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginTop: 4, fontFamily: 'monospace' }}>
                  #{shortId}
                </div>
              </div>
            </div>
          </div>

          {/* ══ SUCCESS BANNER ══ */}
          <div style={{ background: '#f0fdf4', padding: '16px 40px', borderBottom: '1px solid #dcfce7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle style={{ width: 20, height: 20, color: '#16a34a' }} />
              <span style={{ color: '#15803d', fontSize: 15, fontWeight: 700 }}>
                Order Confirmed — {order.paymentMethod === 'stripe' ? 'Payment Processing' : 'Thank you for your purchase!'}
              </span>
            </div>
            <span style={{ color: '#16a34a', fontSize: 12 }}>{dateStr} IST</span>
          </div>

          {/* ══ BODY ══ */}
          <div style={{ padding: '36px 40px' }}>

            {/* ORDER META GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
              {[
                { label: 'Order ID',       value: <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{order._id}</span> },
                { label: 'Date',           value: dateStr },
                { label: 'Payment',        value: payLabel },
                { label: 'Status',         value: (order.paymentStatus || 'pending').toUpperCase(), color: order.paymentStatus === 'paid' ? '#16a34a' : '#d97706' },
              ].map((cell, i) => (
                <div key={i} style={{
                  padding: '14px 16px',
                  background: '#f8fafc',
                  borderRight: i < 3 ? '1px solid #e2e8f0' : 'none',
                }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: 4 }}>{cell.label}</div>
                  <div style={{ fontSize: 12, color: cell.color || '#1e293b', fontWeight: 600 }}>{cell.value}</div>
                </div>
              ))}
            </div>

            {/* ITEMS TABLE */}
            <h3 style={{ margin: '0 0 12px', fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700 }}>
              Items Ordered
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Item', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                    <th key={i} style={{
                      padding: '12px 16px',
                      fontSize: 11, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700,
                      textAlign: i === 0 ? 'left' : i === 1 ? 'center' : 'right',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Size: {item.size}</div>
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontSize: 14, color: '#475569' }}>{item.qty}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: 14, color: '#475569' }}>
                      ₹{Number(item.price).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                      ₹{(item.price * item.qty).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOTALS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
              <table style={{ width: 280, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 0', fontSize: 13, color: '#64748b' }}>Subtotal</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontSize: 13, color: '#64748b' }}>₹{subtotal.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', fontSize: 13, color: '#64748b' }}>Shipping</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontSize: 13, color: '#64748b' }}>{shipping === 0 ? 'Free' : `₹${shipping.toLocaleString('en-IN')}`}</td>
                  </tr>
                  {discount > 0 && (
                    <tr>
                      <td style={{ padding: '6px 0', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                        Coupon {order.couponCode ? `(${order.couponCode})` : 'Discount'}
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                        −₹{discount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="2" style={{ borderTop: '2px solid #e2e8f0', paddingTop: 4 }} />
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 0 4px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Grand Total</td>
                    <td style={{ padding: '10px 0 4px', textAlign: 'right', fontSize: 18, fontWeight: 900, color: '#6b1414' }}>
                      ₹{finalAmt.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ADDRESS + CUSTOMER */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
              <div style={{ padding: '20px 24px', borderRight: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: 10 }}>Customer</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{addr.fullName || 'Customer'}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{addr.phone || ''}</div>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: 10 }}>Shipping Address</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                  {addr.street || 'Geeta University Campus'}<br />
                  {addr.city || 'Panipat'}, {addr.state || 'Haryana'} — {addr.pincode || ''}<br />
                  📞 {addr.phone || ''}
                </div>
              </div>
            </div>

          </div>

          {/* ══ ADMIN SIGNATURE + VERIFIED BADGE ══ */}
          <div style={{ background: '#f8fafc', padding: '28px 40px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Signature */}
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: 8 }}>Authorised By</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', fontStyle: 'italic', letterSpacing: '-0.3px' }}>Dr. V.K. Sharma</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Director of Student Affairs</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Geeta University, Panipat, Haryana</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>📧 admin@geetauniversity.ac.in</div>
            </div>

            {/* Circular Verified Stamp */}
            <img src="https://tse4.mm.bing.net/th/id/OIP.lKE9EXof07hcB9Ps72C5fQAAAA?r=0&w=200&h=200&rs=1&pid=ImgDetMain&o=7&rm=3" alt="Verified Stamp" style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: '50%' }} />
          </div>

          {/* ══ FOOTER ══ */}
          <div style={{ background: '#1e293b', padding: '20px 40px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: 12 }}>
              Geeta University Merchandise Store · Block A, Panipat, Haryana — 132145
            </p>
            <p style={{ margin: 0, color: '#475569', fontSize: 11 }}>
              This is a computer-generated receipt. For queries: admin@geetauniversity.ac.in
            </p>
          </div>

        </div>

        {/* Download button at bottom (also hidden on print) */}
        <div className="no-print text-center mt-8 pb-10">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#6b1414] hover:bg-[#591010] text-white text-sm font-bold rounded-xl transition-all shadow-lg"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <p className="text-xs text-slate-400 mt-3">
            Your browser will open a print dialog — choose "Save as PDF"
          </p>
        </div>
      </div>
    </>
  );
};

export default OrderReceipt;
