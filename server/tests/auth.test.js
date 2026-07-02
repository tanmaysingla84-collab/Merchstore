// ─── tests/auth.test.js ───────────────────────────────────────────────────────
// M1 Owned — Auth Controller Unit Tests

jest.mock('../models/User');
jest.mock('../utils/generateToken');

const { register, login, getMe, googleCallback } = require('../controllers/authController');
const User          = require('../models/User');
const generateToken = require('../utils/generateToken');

const mockRes = () => {
  const res = {};
  res.status   = jest.fn().mockReturnValue(res);
  res.json     = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

const mockUser = {
  _id:           'user_oid_123',
  name:          'Test User',
  email:         'test@geeta.edu',
  role:          'student',
  phone:         '1234567890',
  avatar:        'http://avatar.url',
  matchPassword: jest.fn(),
  save:          jest.fn(),
};

describe('AuthController', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── register ───────────────────────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('registers user and returns JWT on success', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('test_jwt_token');

      const req = {
        body: {
          name:     'Test User',
          email:    'test@geeta.edu',
          password: 'Password123',
          phone:    '1234567890',
          role:     'student',
        },
      };
      const res = mockRes();
      const next = jest.fn();

      await register(req, res, next);

      if (next.mock.calls.length > 0) {
        console.error('register error:', next.mock.calls[0][0]);
      }
      expect(next).not.toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@geeta.edu' });
      expect(User.create).toHaveBeenCalledWith({
        name:     'Test User',
        email:    'test@geeta.edu',
        password: 'Password123',
        phone:    '1234567890',
        role:     'student',
      });
      expect(generateToken).toHaveBeenCalledWith(mockUser);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data:    expect.objectContaining({ token: 'test_jwt_token' }),
        })
      );
    });

    it('returns 409 when email is already registered', async () => {
      User.findOne.mockResolvedValue(mockUser);

      const req = { body: { email: 'test@geeta.edu', name: 'Test', password: '123' } };
      const res = mockRes();
      const next = jest.fn();

      await register(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/exists/i),
        })
      );
    });
  });

  // ── login ──────────────────────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('authenticates user and returns token on valid credentials', async () => {
      // select('+password') is chained in controller, mock that chain:
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      mockUser.matchPassword.mockResolvedValue(true);
      mockUser.isActive = true;
      generateToken.mockReturnValue('valid_token');

      const req = { body: { email: 'test@geeta.edu', password: 'Password123' } };
      const res = mockRes();
      const next = jest.fn();

      await login(req, res, next);

      if (next.mock.calls.length > 0) {
        console.error('login error:', next.mock.calls[0][0]);
      }
      expect(next).not.toHaveBeenCalled();
      expect(mockUser.matchPassword).toHaveBeenCalledWith('Password123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data:    expect.objectContaining({ token: 'valid_token' }),
        })
      );
    });

    it('returns 401 on incorrect password', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      mockUser.matchPassword.mockResolvedValue(false);

      const req = { body: { email: 'test@geeta.edu', password: 'BadPassword' } };
      const res = mockRes();
      const next = jest.fn();

      await login(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 for inactive users', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(inactiveUser),
      });

      const req = { body: { email: 'test@geeta.edu', password: 'Password123' } };
      const res = mockRes();
      const next = jest.fn();

      await login(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ── getMe ──────────────────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('returns request attached user profile', async () => {
      const req = { user: mockUser };
      const res = mockRes();
      const next = jest.fn();

      await getMe(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data:    expect.objectContaining({ email: 'test@geeta.edu' }),
        })
      );
    });
  });

  // ── googleCallback ────────────────────────────────────────────────         
  describe('GET /api/auth/google/callback redirect', () => {
    it('redirects to frontend page with JWT on successful authentication', async () => {
      generateToken.mockReturnValue('oauth_jwt');

      const req = { user: mockUser };
      const res = mockRes();
      const next = jest.fn();

      await googleCallback(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(generateToken).toHaveBeenCalledWith(mockUser);
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/oauth-success?token=oauth_jwt')
      );
    });

    it('returns 401 if user auth failed', async () => {
      const req = { user: null };
      const res = mockRes();
      const next = jest.fn();

      await googleCallback(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
