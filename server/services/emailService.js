// ─── services/emailService.js ─────────────────────────────────────────────────
// M2 Owned — Nodemailer SMTP service with reusable templates

const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Lazy-initialize nodemailer transporter
 */
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,  // STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }
  return transporter;
};

/**
 * Core send function
 * @param {string} to        - Recipient email
 * @param {string} subject   - Email subject
 * @param {string} html      - HTML body
 * @param {string} [text]    - Plain text fallback
 */
const sendEmail = async (to, subject, html, text = '') => {
  const t = getTransporter();

  const mailOptions = {
    from: `"MerchStore 🎓" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ' '),
  };

  try {
    const info = await t.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    throw err;
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// HTML Email Templates
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Build HTML for low-stock alert email
 * @param {Array<{name: string, sku: string, size: string, stock: number}>} products
 */
const buildLowStockHTML = (products) => {
  const rows = products.map(p => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-weight:600;">${p.name}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-family:monospace;color:#6b7280;">${p.sku || 'N/A'}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:center;">${p.size}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:center;">
        <span style="background:${p.stock === 0 ? '#fee2e2' : '#fef9c3'};color:${p.stock === 0 ? '#dc2626' : '#92400e'};padding:4px 10px;border-radius:9999px;font-weight:700;font-size:13px;">
          ${p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} left`}
        </span>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;">
            <table width="100%"><tr>
              <td>
                <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">🎓 MerchStore</h1>
                <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Geeta University · Inventory Management</p>
              </td>
              <td align="right">
                <span style="background:#ef4444;color:#fff;padding:6px 14px;border-radius:9999px;font-size:12px;font-weight:700;">⚠️ LOW STOCK ALERT</span>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Inventory Alert — Action Required</h2>
            <p style="margin:0 0 24px;color:#64748b;line-height:1.6;">
              The following products are running low on stock (below threshold of <strong>${process.env.LOW_STOCK_THRESHOLD || 10} units</strong>). 
              Please restock to avoid disruption.
            </p>

            <!-- Products Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:12px 16px;text-align:left;color:#374151;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Product</th>
                  <th style="padding:12px 16px;text-align:left;color:#374151;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">SKU</th>
                  <th style="padding:12px 16px;text-align:center;color:#374151;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Size</th>
                  <th style="padding:12px 16px;text-align:center;color:#374151;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Stock</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <p style="margin:24px 0 0;color:#64748b;font-size:13px;">
              Report generated: <strong>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
              This is an automated alert from MerchStore · Geeta University<br>
              Do not reply to this email — contact IT at <a href="mailto:it@geetauniversity.ac.in" style="color:#3b82f6;">it@geetauniversity.ac.in</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Build a full Amazon-style professional order receipt email.
 *
 * @param {Object} order   - Mongoose Order document (or plain object)
 * @param {Object} user    - { name, email }
 * @param {string} clientUrl - e.g. "http://localhost:5173"
 */
const buildOrderReceiptHTML = (order, user, clientUrl = process.env.CLIENT_URL || 'http://localhost:5173') => {
  const orderId      = order._id.toString();
  const shortId      = orderId.slice(-10).toUpperCase();
  const dateStr      = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  });

  const subtotal     = Number(order.totalAmount   || 0);
  const discount     = Number(order.discountAmount || 0);
  const finalAmt     = Number(order.finalAmount   || subtotal);
  const shipping     = Math.max(0, finalAmt - subtotal + discount);

  const addr         = order.address || {};
  const payMethod    = (order.paymentMethod || 'cod').toUpperCase();
  const payStatus    = (order.paymentStatus  || 'pending').toUpperCase();
  const receiptUrl   = `${clientUrl}/order/${orderId}/receipt`;

  // ── Logo: public logo.png served by frontend origin ──
  const logoUrl = `${clientUrl}/logo.png`;

  // ── Item rows ─────────────────────────────────────────
  const itemRows = (order.items || []).map(item => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;">
        <div style="font-weight:600;">${item.name}</div>
        <div style="font-size:12px;color:#64748b;margin-top:2px;">Size: ${item.size}</div>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:14px;color:#475569;">${item.qty}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px;color:#475569;">₹${Number(item.price).toLocaleString('en-IN')}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px;font-weight:600;color:#1e293b;">₹${(item.price * item.qty).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  // ── Discount row (only if coupon applied) ─────────────
  const discountRow = discount > 0 ? `
    <tr>
      <td colspan="2" style="padding:8px 0;color:#16a34a;font-size:13px;">
        Coupon Discount ${order.couponCode ? `(${order.couponCode})` : ''}
      </td>
      <td style="padding:8px 0;text-align:right;color:#16a34a;font-size:13px;font-weight:600;">
        −₹${discount.toLocaleString('en-IN')}
      </td>
    </tr>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Order Receipt — Geeta University MerchStore</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);max-width:640px;">

        <!-- ══ HEADER ══ -->
        <tr>
          <td style="background:linear-gradient(135deg,#6b1414 0%,#9b1c1c 60%,#7c2d12 100%);padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="${logoUrl}" alt="Geeta University" width="48" height="48"
                       style="border-radius:50%;border:2px solid rgba(255,255,255,0.3);vertical-align:middle;margin-right:12px;display:inline-block;">
                  <span style="display:inline-block;vertical-align:middle;">
                    <div style="color:#fff;font-size:18px;font-weight:800;letter-spacing:-0.3px;line-height:1.2;">Geeta University</div>
                    <div style="color:#fca5a5;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Merchandise Store</div>
                  </span>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <div style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:10px;padding:10px 18px;text-align:right;display:inline-block;">
                    <div style="color:#fecaca;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">OFFICIAL RECEIPT</div>
                    <div style="color:#fff;font-size:13px;font-weight:700;margin-top:4px;font-family:monospace;">
                      #${shortId}
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ══ SUCCESS BANNER ══ -->
        <tr>
          <td style="background:#f0fdf4;padding:18px 40px;border-bottom:1px solid #dcfce7;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="display:inline-block;width:20px;height:20px;background:#16a34a;border-radius:50%;text-align:center;line-height:20px;color:#fff;font-size:13px;font-weight:900;margin-right:10px;vertical-align:middle;">✓</span>
                  <span style="color:#15803d;font-size:15px;font-weight:700;vertical-align:middle;">
                    Order Confirmed — ${payMethod === 'STRIPE' ? 'Payment Processing' : 'Thank you for your purchase!'}
                  </span>
                </td>
                <td align="right" style="color:#16a34a;font-size:12px;">${dateStr} IST</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ══ BODY ══ -->
        <tr>
          <td style="padding:36px 40px;">

            <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7;">
              Hi <strong style="color:#1e293b;">${user.name}</strong>,<br>
              Your order from <strong>Geeta University MerchStore</strong> has been placed successfully.
              A copy of this receipt has been sent to <strong>${user.email}</strong>.
            </p>

            <!-- ORDER META GRID -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:14px 20px;border-right:1px solid #e2e8f0;background:#f8fafc;">
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px;">Order ID</div>
                  <div style="font-size:12px;color:#1e293b;font-family:monospace;font-weight:600;">${orderId}</div>
                </td>
                <td style="padding:14px 20px;border-right:1px solid #e2e8f0;background:#f8fafc;">
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px;">Date</div>
                  <div style="font-size:12px;color:#1e293b;font-weight:600;">${dateStr}</div>
                </td>
                <td style="padding:14px 20px;border-right:1px solid #e2e8f0;background:#f8fafc;">
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px;">Payment</div>
                  <div style="font-size:12px;color:#1e293b;font-weight:600;">${payMethod === 'STRIPE' ? 'Card (Stripe)' : payMethod === 'UPI' ? 'UPI' : 'Cash on Delivery'}</div>
                </td>
                <td style="padding:14px 20px;background:#f8fafc;">
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px;">Status</div>
                  <div style="font-size:12px;font-weight:700;color:${payStatus === 'PAID' ? '#16a34a' : '#d97706'};">
                    ${payStatus}
                  </div>
                </td>
              </tr>
            </table>

            <!-- ITEMS TABLE -->
            <h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;">Items Ordered</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:12px 16px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Item</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Qty</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Unit Price</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <!-- TOTALS -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr><td width="60%"></td><td width="40%">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Subtotal</td>
                    <td style="padding:6px 0;text-align:right;font-size:13px;color:#64748b;">₹${subtotal.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Shipping</td>
                    <td style="padding:6px 0;text-align:right;font-size:13px;color:#64748b;">${shipping === 0 ? 'Free' : '₹' + shipping.toLocaleString('en-IN')}</td>
                  </tr>
                  ${discountRow}
                  <tr>
                    <td colspan="3" style="border-top:2px solid #e2e8f0;padding-top:4px;"></td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0 4px;font-size:16px;font-weight:800;color:#1e293b;">Grand Total</td>
                    <td style="padding:10px 0 4px;text-align:right;font-size:18px;font-weight:900;color:#6b1414;">₹${finalAmt.toLocaleString('en-IN')}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- ADDRESS + CUSTOMER INFO -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;border-right:1px solid #e2e8f0;vertical-align:top;width:50%;">
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:10px;">Customer</div>
                  <div style="font-size:14px;font-weight:700;color:#1e293b;">${user.name}</div>
                  <div style="font-size:13px;color:#64748b;margin-top:2px;">${user.email}</div>
                </td>
                <td style="padding:20px 24px;vertical-align:top;width:50%;">
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:10px;">Shipping / Collection Address</div>
                  <div style="font-size:14px;font-weight:700;color:#1e293b;">${addr.fullName || user.name}</div>
                  <div style="font-size:13px;color:#64748b;line-height:1.6;margin-top:2px;">
                    ${addr.street || 'Geeta University Campus'}<br>
                    ${addr.city || 'Panipat'}, ${addr.state || 'Haryana'} — ${addr.pincode || ''}<br>
                    📞 ${addr.phone || ''}
                  </div>
                </td>
              </tr>
            </table>

            <!-- VIEW RECEIPT CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="${receiptUrl}"
                     style="display:inline-block;background:linear-gradient(135deg,#6b1414,#9b1c1c);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(107,20,20,0.35);">
                    📄 View / Download Receipt
                  </a>
                  <p style="margin:10px 0 0;font-size:11px;color:#94a3b8;">
                    Or copy this link: <a href="${receiptUrl}" style="color:#6b1414;">${receiptUrl}</a>
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ══ ADMIN SIGNATURE + VERIFIED BADGE ══ -->
        <tr>
          <td style="background:#f8fafc;padding:28px 40px;border-top:1px solid #e2e8f0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <!-- Signature Block -->
                <td style="vertical-align:top;width:60%;">
                  <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:8px;">Authorised By</div>
                  <div style="font-size:15px;font-weight:800;color:#1e293b;font-style:italic;letter-spacing:-0.3px;">Dr. V.K. Sharma</div>
                  <div style="font-size:12px;color:#64748b;margin-top:2px;">Director of Student Affairs</div>
                  <div style="font-size:12px;color:#64748b;">Geeta University, Panipat, Haryana</div>
                  <div style="font-size:11px;color:#94a3b8;margin-top:6px;">📧 admin@geetauniversity.ac.in</div>
                </td>
                <!-- Circular Verified Stamp -->
                <td align="right" style="vertical-align:middle;width:40%;">
                  <img src="https://tse4.mm.bing.net/th/id/OIP.lKE9EXof07hcB9Ps72C5fQAAAA?r=0&w=200&h=200&rs=1&pid=ImgDetMain&o=7&rm=3" alt="Verified Stamp" width="100" height="100" style="display:inline-block; border-radius: 50%;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ══ FOOTER ══ -->
        <tr>
          <td style="background:#1e293b;padding:20px 40px;text-align:center;">
            <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">
              Geeta University Merchandise Store · Block A, Panipat, Haryana — 132145
            </p>
            <p style="margin:0;color:#475569;font-size:11px;">
              This is a computer-generated receipt. Do not reply to this email.
              For queries: <a href="mailto:admin@geetauniversity.ac.in" style="color:#fca5a5;">admin@geetauniversity.ac.in</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
};

// Keep old name as alias for backward-compatibility with any callers
const buildOrderConfirmHTML = buildOrderReceiptHTML;

// For testing: allow transporter reset
const _resetForTest = () => { transporter = null; };

module.exports = {
  sendEmail,
  buildLowStockHTML,
  buildOrderConfirmHTML,
  buildOrderReceiptHTML,
  _resetForTest,
};
