// ─── utils/cloudinaryUpload.js ────────────────────────────────────────────────
// M1 Owned — Multer Cloudinary storage configuration & deletion helper

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer                 = require('multer');
const cloudinary             = require('../config/cloudinary');
const path                   = require('path');
const fs                     = require('fs');

const isCloudinaryConfigured = 
  process.env.NODE_ENV === 'test' ||
  (process.env.CLOUDINARY_CLOUD_NAME && 
   process.env.CLOUDINARY_API_KEY && 
   process.env.CLOUDINARY_API_SECRET && 
   !process.env.CLOUDINARY_CLOUD_NAME.includes('placeholder') &&
   !process.env.CLOUDINARY_API_KEY.includes('placeholder') &&
   !process.env.CLOUDINARY_API_SECRET.includes('placeholder') &&
   process.env.CLOUDINARY_CLOUD_NAME !== 'dummy_cloud' &&
   process.env.CLOUDINARY_API_KEY !== 'dummy_key');

let storage;

if (isCloudinaryConfigured) {
  // 1. Setup Cloudinary storage for Multer
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder:          'merchstore/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation:  [{ width: 800, height: 800, crop: 'limit' }],
    },
  });
} else {
  // Local storage fallback
  const uploadDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = {
    _handleFile(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
      const destPath = path.join(uploadDir, filename);

      const outStream = fs.createWriteStream(destPath);
      file.stream.pipe(outStream);

      outStream.on('error', cb);
      outStream.on('finish', () => {
        const protocol = req.protocol;
        const host = req.get('host');
        // Construct the HTTP path that the client can request
        const webPath = `${protocol}://${host}/uploads/${filename}`;
        cb(null, {
          destination: uploadDir,
          filename: filename,
          path: webPath,
          size: outStream.bytesWritten
        });
      });
    },
    _removeFile(req, file, cb) {
      const filePath = path.join(uploadDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, cb);
      } else {
        cb();
      }
    }
  };
}

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
 * Delete an asset from Cloudinary or local storage using its URL
 * @param {string} url - Image URL
 * @returns {Promise<boolean>} Success status
 */
const deleteFromCloudinary = async (url) => {
  if (!url || typeof url !== 'string') return false;

  // Handle local files
  if (url.includes('/uploads/')) {
    try {
      const filename = url.split('/uploads/')[1];
      if (filename) {
        const filePath = path.join(__dirname, '../public/uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error(`❌ Local file delete error for url ${url}:`, err.message);
      return false;
    }
  }

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
