const cron = require('node-cron');
const Product = require('../models/Product');
const { sendEmail } = require('../services/emailService');

const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '10');
const alertEmail = process.env.ALERT_EMAIL || 'admin@geetauniversity.ac.in';

const checkLowStock = async () => {
  try {
    console.log('Running daily low stock inventory check...');
    
    // Find products where at least one size has stock lower than the threshold
    const lowStockProducts = await Product.find({
      'sizes.stock': { $lt: threshold }
    });

    if (lowStockProducts.length === 0) {
      console.log('Inventory check complete: All products have sufficient stock.');
      return;
    }

    // Build low stock list HTML
    let tableRows = '';
    lowStockProducts.forEach(product => {
      product.sizes.forEach(sz => {
        if (sz.stock < threshold) {
          tableRows += `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${product.name}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${sz.size}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: red; font-weight: bold;">${sz.stock}</td>
            </tr>
          `;
        }
      });
    });

    const htmlContent = `
      <h2>Geeta University MerchStore - Low Stock Inventory Alert</h2>
      <p>The following items have stock levels below the threshold of <strong>${threshold}</strong> units:</p>
      <table style="width: 100%; border-collapse: collapse; font-family: sans-serif;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Product Name</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Size</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Current Stock</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <br/>
      <p>Please log in to the admin panel to update stock levels.</p>
    `;

    await sendEmail(alertEmail, 'Alert: Low Stock Inventory Report', htmlContent);
    console.log(`Low stock inventory email report sent to ${alertEmail}`);
  } catch (error) {
    console.error(`Error in low stock inventory check: ${error.message}`);
  }
};

// Schedule job: Run every day at 8:00 AM by default ('0 8 * * *')
const cronSchedule = process.env.CRON_SCHEDULE || '0 8 * * *';
cron.schedule(cronSchedule, () => {
  checkLowStock();
});

module.exports = { checkLowStock };
