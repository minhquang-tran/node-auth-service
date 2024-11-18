// models/user.js
const db = require('../db/connection');

const createUser = async (user) => {
  return await db('Users').insert(user);
};

const getUserByEmail = async (email) => {
  return await db('Users').where({ email }).first();
};

module.exports = {
  createUser,
  getUserByEmail
};