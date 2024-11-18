// controllers/auth.js
const bcrypt = require('bcrypt');
const userModel = require('../models/user');
const tokenModel = require('../models/token');
const jwt = require('jsonwebtoken');
const { expressjwt } = require('express-jwt');

const SECRET_KEY = process.env.SECRET_KEY;
const TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '30d';
const SALT_ROUNDS = 10;

const signUp = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).send('Missing fields');
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).send('Invalid email format');
    }
    if (password.length < 8 || password.length > 20) {
      return res.status(400).send('Password must be between 8-20 characters');
    }

    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).send('Email is already registered');
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [userId] = await userModel.createUser({
      firstName,
      lastName,
      email,
      hash,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(201).json({
      id: userId,
      firstName,
      lastName,
      email,
      displayName: `${firstName} ${lastName}`
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error');
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send('Missing fields');
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).send('Invalid email format');
    }

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(400).send('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password, user.hash);
    if (!validPassword) {
      return res.status(400).send('Invalid credentials');
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });
    const refreshToken = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });

    await tokenModel.createToken({
      userId: user.id,
      refreshToken,
      expiresIn: REFRESH_TOKEN_EXPIRY,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(200).json({
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        displayName: `${user.firstName} ${user.lastName}`
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error');
  }
};

const signOut = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(400).send('Authorization header missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(400).send('Token missing');
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    await tokenModel.deleteTokensByUserId(decoded.id);

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error');
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const tokenRecord = await tokenModel.getToken(refreshToken);
    if (!tokenRecord) {
      return res.status(404).send('Refresh token not found');
    }

    const newToken = jwt.sign({ id: tokenRecord.userId }, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });
    const newRefreshToken = jwt.sign({ id: tokenRecord.userId }, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });

    await tokenModel.deleteToken(refreshToken);

    await tokenModel.createToken({
      userId: tokenRecord.userId,
      refreshToken: newRefreshToken,
      expiresIn: REFRESH_TOKEN_EXPIRY,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(200).json({
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error');
  }
};

const authenticate = expressjwt({
  secret: SECRET_KEY,
  algorithms: ['HS256']
});

module.exports = {
  signUp,
  signIn,
  signOut,
  refreshToken,
  authenticate
};