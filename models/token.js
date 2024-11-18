// models/token.js
const db = require('../db/connection');

const createToken = async (token) => {
  return await db('Tokens').insert(token);
};

const getToken = async (refreshToken) => {
  return await db('Tokens').where({ refreshToken }).first();
};

const deleteTokensByUserId = async (userId) => {
  return await db('Tokens').where({ userId }).del();
};

const deleteToken = async (refreshToken) => {
  return await db('Tokens').where({ refreshToken }).del();
};

module.exports = {
  createToken,
  getToken,
  deleteTokensByUserId,
  deleteToken
};