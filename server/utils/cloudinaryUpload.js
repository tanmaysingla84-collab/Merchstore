// ─── utils/cloudinaryUpload.js ────────────────────────────────────────────────
// M1 Owned — Multer Cloudinary storage configuration & deletion helper

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer                 = require('multer');
const cloudinary             = require('../config/cloudinary');

// 1. Setup Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder:          'merchstore/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 800, height: 800, crop: 'limit' }],
  },
});

const upload = multer({
  storage: storage,
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * Extracts the public ID from a Cloudinary URL
 * @param {string} url - Full Cloudinary URL
 * @returns {string|null} Public ID or null
 */
const extractPublicId = (url) => {
  try {
    if (!url || typeof url !== 'string') return null;
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    let segment = parts[1];
    // Remove the version tag (e.g., v16234234/)
    if (segment.startsWith('v')) {
      const slashIndex = segment.indexOf('/');
      if (slashIndex !== -1) {
        segment = segment.substring(slashIndex + 1);
      }
    }
    // Remove file extension
    const dotIndex = segment.lastIndexOf('.');
    if (dotIndex !== -1) {
      segment = segment.substring(0, dotIndex);
    }
    return segment;
  } catch (_) {
    return null;
  }
};

/**
 * Delete an asset from Cloudinary using its URL
 * @param {string} url - Cloudinary image URL
 * @returns {Promise<boolean>} Success status
 */
const deleteFromCloudinary = async (url) => {
  const publicId = extractPublicId(url);
  if (!publicId) return false;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (err) {
    console.error(`❌ Cloudinary delete error for publicId ${publicId}:`, err.message);
    return false;
  }
};

module.exports = {
  upload,
  deleteFromCloudinary,
  extractPublicId,
};
