// ─── cron/lowStockCron.js ─────────────────────────────────────────────────────
// M2 Owned — node-cron job: daily stock check + email alert

const cron                          = require('node-cron');
const { getLowStockItems }          = require('../services/inventoryService');
const { sendEmail, buildLowStockHTML } = require('../services/emailService');

let scheduledTask = null;

/**
 * The core job logic (exported separately so it can be triggered manually / tested)
 */
const runLowStockCheck = async () => {
  console.log(`🕐 [LowStockCron] Running stock check at ${new Date().toISOString()}`);

  try {
    const lowStockItems = await getLowStockItems();

    if (lowStockItems.length === 0) {
      console.log('✅ [LowStockCron] All products are sufficiently stocked.');
      return { sent: false, itemCount: 0 };
    }

    const alertEmail = process.env.ALERT_EMAIL || 'admin@geetauniversity.ac.in';
    const subject    = `⚠️ [MerchStore] Low Stock Alert — ${lowStockItems.length} item(s) need attention`;
    const html       = buildLowStockHTML(lowStockItems);

    await sendEmail(alertEmail, subject, html);

    console.log(`📧 [LowStockCron] Alert sent for ${lowStockItems.length} low-stock items to ${alertEmail}`);

    return { sent: true, itemCount: lowStockItems.length, items: lowStockItems };
  } catch (err) {
    console.error('❌ [LowStockCron] Job failed:', err.message);
    throw err;
  }
};

/**
 * Initialize and start the cron job.
 * Safe to call only once — guards against duplicate scheduling.
 */
const startLowStockCron = () => {
  if (scheduledTask) {
    console.warn('⚠️ [LowStockCron] Already scheduled — skipping duplicate init');
    return scheduledTask;
  }

  const cronSchedule = process.env.CRON_SCHEDULE || '0 8 * * *';

  if (!cron.validate(cronSchedule)) {
    throw new Error(`Invalid cron schedule: "${cronSchedule}"`);
  }

  scheduledTask = cron.schedule(cronSchedule, runLowStockCheck, {
    scheduled: true,
    timezone:  'Asia/Kolkata',
  });

  console.log(`⏰ [LowStockCron] Scheduled: "${cronSchedule}" (IST) | Threshold: ${process.env.LOW_STOCK_THRESHOLD || 10} units`);

  return scheduledTask;
};

/**
 * Stop the cron job (useful for graceful shutdown and tests)
 */
const stopLowStockCron = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('⏹️ [LowStockCron] Stopped');
  }
};

module.exports = { startLowStockCron, stopLowStockCron, runLowStockCheck };
