import jwt from 'jsonwebtoken';

/**
 * Generate JWT Access Token
 * @param {Object} payload - Data yang mau disimpan di token
 * @returns {String} - JWT token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

/**
 * Generate JWT Refresh Token
 * @param {Object} payload - Data yang mau disimpan di token
 * @returns {String} - JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

/**
 * Verify JWT Token
 * @param {String} token - Token yang mau diverifikasi
 * @param {String} secret - Secret key
 * @returns {Object} - Decoded payload
 */
export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

/**
 * Generate Reset Password Token
 * @param {String} userId - User ID
 * @returns {String} - Reset token
 */
export const generateResetToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Reset token expires dalam 1 jam
  });
};