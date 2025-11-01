import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/helpers.js';
import prisma from '../config/database.js';

/**
 * Middleware untuk authenticate user
 * Cek apakah user punya token yang valid
 */
export const authenticate = async (req, res, next) => {
  try {
    // Ambil token dari header Authorization atau cookie
    let token = req.headers.authorization?.split(' ')[1]; // Bearer token
    
    if (!token) {
      token = req.cookies?.accessToken; // Dari cookie
    }

    if (!token) {
      return errorResponse(res, 'Access token required', 401);
    }

    // Verify token
    const decoded = verifyToken(token, process.env.JWT_SECRET);
    
    // Cari user di database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
      }
    });

    if (!user || !user.isActive) {
      return errorResponse(res, 'User not found or inactive', 401);
    }

    // Simpan user info ke req object
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401);
    }
    return errorResponse(res, 'Authentication failed', 401);
  }
};

/**
 * Middleware untuk authorize berdasarkan role
 * @param {Array} roles - Array of allowed roles
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Middleware untuk optional authentication
 * Kalau ada token, authenticate. Kalau nggak ada, lanjut aja
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (token) {
      const decoded = verifyToken(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          isActive: true,
        }
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Kalau error, tetap lanjut tanpa user
    next();
  }
};