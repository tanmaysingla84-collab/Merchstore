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
 * Build HTML for order confirmation email
 */
const buildOrderConfirmHTML = (order, user) => {
  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;">${item.name} (${item.size})</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;text-align:center;">×${item.qty}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${(item.price * item.qty).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html><html><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:40px 0;">
<table width="600" align="center" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:28px 32px;">
    <h2 style="margin:0;color:#fff;font-size:20px;">✅ Order Confirmed!</h2>
    <p style="margin:4px 0 0;color:#d1fae5;">Order #${order._id.toString().slice(-8).toUpperCase()}</p>
  </td></tr>
  <tr><td style="padding:28px 32px;">
    <p>Hi <strong>${user.name}</strong>, your order has been placed successfully.</p>
    <table width="100%" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:16px 0;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:10px 16px;text-align:left;">Item</th>
        <th style="padding:10px 16px;text-align:center;">Qty</th>
        <th style="padding:10px 16px;text-align:right;">Price</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr style="background:#f8fafc;font-weight:700;">
          <td colspan="2" style="padding:12px 16px;text-align:right;">Total Paid:</td>
          <td style="padding:12px 16px;text-align:right;color:#10b981;">₹${order.finalAmount.toLocaleString('en-IN')}</td>
        </tr>
      </tfoot>
    </table>
    <p style="color:#64748b;font-size:13px;">Payment: <strong>${order.paymentMethod.toUpperCase()}</strong> · Status: <strong>${order.paymentStatus.toUpperCase()}</strong></p>
  </td></tr>
</table>
</body></html>
  `.trim();
};

// For testing: allow transporter reset
const _resetForTest = () => { transporter = null; };

module.exports = {
  sendEmail,
  buildLowStockHTML,
  buildOrderConfirmHTML,
  _resetForTest,
};
