// ─── tests/utils.test.js ──────────────────────────────────────────────────────
// M1 Owned — Tests for generateToken and cloudinaryUpload utilities

jest.mock('jsonwebtoken');
jest.mock('../config/cloudinary', () => ({
  uploader: {
    destroy: jest.fn(),
  },
}));

const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const generateToken = require('../utils/generateToken');
const { extractPublicId, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

describe('generateToken utility', () => {
  it('signs a token with correct payload', () => {
    jwt.sign.mockReturnValue('signed_token_123');

    const mockUser = {
      _id:   'user123_id',
      email: 'test@geeta.edu',
      role:  'student',
    };

    const token = generateToken(mockUser);

    expect(jwt.sign).toHaveBeenCalledWith(
      {
        id:    'user123_id',
        email: 'test@geeta.edu',
        role:  'student',
      },
      expect.any(String),
      expect.objectContaining({ expiresIn: expect.any(String) })
    );
    expect(token).toBe('signed_token_123');
  });
});

describe('cloudinaryUpload utility helpers', () => {
  describe('extractPublicId', () => {
    it('correctly extracts public id from typical cloudinary url', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v123456789/merchstore/products/hoodie.jpg';
      const publicId = extractPublicId(url);
      expect(publicId).toBe('merchstore/products/hoodie');
    });

    it('handles urls without version tag', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/merchstore/products/hoodie.png';
      const publicId = extractPublicId(url);
      expect(publicId).toBe('merchstore/products/hoodie');
    });

    it('returns null for invalid inputs', () => {
      expect(extractPublicId(null)).toBeNull();
      expect(extractPublicId(undefined)).toBeNull();
      expect(extractPublicId(12345)).toBeNull();
      expect(extractPublicId('http://example.com/not/cloudinary')).toBeNull();
    });
  });

  describe('deleteFromCloudinary', () => {
    it('returns false immediately if no publicId can be extracted', async () => {
      const result = await deleteFromCloudinary('invalid_url');
      expect(result).toBe(false);
    });

    it('calls cloudinary uploader.destroy and returns true on ok status', async () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/merchstore/products/hoodie.jpg';
      cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

      const result = await deleteFromCloudinary(url);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('merchstore/products/hoodie');
      expect(result).toBe(true);
    });

    it('returns false if cloudinary deletion fails', async () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/merchstore/products/hoodie.jpg';
      cloudinary.uploader.destroy.mockResolvedValue({ result: 'not found' });

      const result = await deleteFromCloudinary(url);

      expect(result).toBe(false);
    });

    it('returns false and logs error on rejection', async () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/merchstore/products/hoodie.jpg';
      cloudinary.uploader.destroy.mockRejectedValue(new Error('Network error'));

      const result = await deleteFromCloudinary(url);

      expect(result).toBe(false);
    });
  });
});
