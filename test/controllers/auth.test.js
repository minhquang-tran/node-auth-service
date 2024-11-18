//test/controllers/auth.test.js
const { signUp, signIn, signOut, refreshToken } = require('../../controllers/auth');
const userModel = require('../../models/user');
const tokenModel = require('../../models/token');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { expressjwt } = require('express-jwt');

jest.mock('../../models/user');
jest.mock('../../models/token');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const SECRET_KEY = 'test-secret';
process.env.SECRET_KEY = SECRET_KEY;

jest.mock('express-jwt', () => {
  return {
    expressjwt: jest.fn((options) => {
      if (!options.secret) {
        options.secret = SECRET_KEY;
      }
      return (req, res, next) => next();
    }),
  };
});

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  describe('signUp', () => {
    it('should return 400 if required fields are missing', async () => {
      req.body = { email: '', password: '', firstName: '', lastName: '' };
      await signUp(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Missing fields');
    });

    it('should return 400 if email format is invalid', async () => {
      req.body = { email: 'invalidEmail', password: 'password', firstName: 'John', lastName: 'Doe' };
      await signUp(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid email format');
    });

    it('should return 400 if password length is not between 8 and 20 characters', async () => {
      req.body = { email: 'test@example.com', password: 'short', firstName: 'John', lastName: 'Doe' };
      await signUp(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Password must be between 8-20 characters');
    });

    it('should return 400 if email is already registered', async () => {
      req.body = { email: 'test@example.com', password: 'password123', firstName: 'John', lastName: 'Doe' };
      userModel.getUserByEmail.mockResolvedValue({});
      await signUp(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Email is already registered');
    });

    it('should return 201 and create a new user', async () => {
      req.body = { email: 'test@example.com', password: 'password123', firstName: 'John', lastName: 'Doe' };
      userModel.getUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      userModel.createUser.mockResolvedValue([1]);

      await signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        displayName: 'John Doe',
      });
    });

    it('should return 500 if there is an internal server error', async () => {
      req.body = { email: 'test@example.com', password: 'password123', firstName: 'John', lastName: 'Doe' };
      userModel.getUserByEmail.mockRejectedValue(new Error('Database error'));
      await signUp(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Internal server error');
    });
  });

  describe('signIn', () => {
    it('should return 400 if required fields are missing', async () => {
      req.body = { email: '', password: '' };
      await signIn(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Missing fields');
    });

    it('should return 400 if email format is invalid', async () => {
      req.body = { email: 'invalidEmail', password: 'password' };
      await signIn(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid email format');
    });

    it('should return 400 if credentials are invalid', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      userModel.getUserByEmail.mockResolvedValue(null);
      await signIn(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid credentials');
    });

    it('should return 400 if password is incorrect', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      userModel.getUserByEmail.mockResolvedValue({ id: 1, hash: 'hashedPassword' });
      bcrypt.compare.mockResolvedValue(false);
      await signIn(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid credentials');
    });

    it('should return 200 and tokens if credentials are valid', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      userModel.getUserByEmail.mockResolvedValue({ id: 1, firstName: 'John', lastName: 'Doe', email: 'test@example.com', hash: 'hashedPassword' });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');
      tokenModel.createToken.mockResolvedValue();

      await signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          displayName: 'John Doe',
        },
        token: 'accessToken',
        refreshToken: 'refreshToken',
      });
    });

    it('should return 500 if there is an internal server error', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      userModel.getUserByEmail.mockRejectedValue(new Error('Database error'));
      await signIn(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Internal server error');
    });
  });

  describe('signOut', () => {
    it('should return 400 if authorization header is missing', async () => {
      req.headers = {};
      await signOut(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Authorization header missing');
    });

    it('should return 400 if token is missing', async () => {
      req.headers = { authorization: 'Bearer ' };
      await signOut(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Token missing');
    });

    it('should return 204 if sign out is successful', async () => {
      req.headers = { authorization: 'Bearer validToken' };
      jwt.verify.mockReturnValue({ id: 1 });
      tokenModel.deleteTokensByUserId.mockResolvedValue();

      await signOut(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 500 if there is an internal server error', async () => {
      req.headers = { authorization: 'Bearer validToken' };
      jwt.verify.mockReturnValue({ id: 1 });
      tokenModel.deleteTokensByUserId.mockRejectedValue(new Error('Database error'));
      await signOut(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Internal server error');
    });
  });

  describe('refreshToken', () => {
    it('should return 404 if refresh token is not found', async () => {
      req.body = { refreshToken: 'invalidToken' };
      tokenModel.getToken.mockResolvedValue(null);
      await refreshToken(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Refresh token not found');
    });

    it('should return 200 and new tokens if refresh token is valid', async () => {
      req.body = { refreshToken: 'validRefreshToken' };
      tokenModel.getToken.mockResolvedValue({ userId: 1 });
      jwt.sign.mockReturnValueOnce('newAccessToken').mockReturnValueOnce('newRefreshToken');
      tokenModel.deleteToken.mockResolvedValue();
      tokenModel.createToken.mockResolvedValue();

      await refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      });
    });

    it('should return 500 if there is an internal server error', async () => {
      req.body = { refreshToken: 'validRefreshToken' };
      tokenModel.getToken.mockRejectedValue(new Error('Database error'));
      await refreshToken(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Internal server error');
    });
  });

  describe('authenticate', () => {
    it('should call expressjwt with correct parameters', () => {
      expect(expressjwt).toHaveBeenCalledWith({
        secret: SECRET_KEY,
        algorithms: ['HS256'],
      });
    });
  });
});
