import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyToken, generateResetToken } from '../utils/jwt.js';
import { successResponse, errorResponse, validateEmail, validatePassword } from '../utils/helpers.js';

/**
 * POST /auth/register
 * Daftar akun baru
 */
export const register = async (req, res) => {
  try {
    const { email, password, name, username } = req.body;

    // Validasi input
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    if (!validateEmail(email)) {
      return errorResponse(res, 'Invalid email format', 400);
    }

    if (!validatePassword(password)) {
      return errorResponse(res, 'Password must be at least 6 characters', 400);
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return errorResponse(res, 'Email already registered', 400);
    }

    // Cek username jika ada
    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUsername) {
        return errorResponse(res, 'Username already taken', 400);
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Simpan refresh token ke database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return successResponse(res, {
      user,
      accessToken,
      refreshToken,
    }, 'Registration successful', 201);

  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, 'Registration failed', 500);
  }
};

/**
 * POST /auth/login
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Cek apakah user aktif
    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated', 401);
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Update refresh token di database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Response tanpa password
    const { password: _, refreshToken: __, ...userResponse } = user;

    return successResponse(res, {
      user: userResponse,
      accessToken,
      refreshToken,
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Login failed', 500);
  }
};

/**
 * POST /auth/logout
 * Logout user
 */
export const logout = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      // Hapus refresh token dari database
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null }
      });
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return successResponse(res, null, 'Logout successful');

  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, 'Logout failed', 500);
  }
};

/**
 * POST /auth/refresh-token
 * Perpanjang token akses
 */
export const refreshToken = async (req, res) => {
  try {
    // Ambil refresh token dari cookie atau body
    let refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return errorResponse(res, 'Refresh token required', 401);
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Cari user dan cek refresh token
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        refreshToken: refreshToken
      }
    });

    if (!user || !user.isActive) {
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({ userId: user.id });
    const newRefreshToken = generateRefreshToken({ userId: user.id });

    // Update refresh token di database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    // Set new cookies
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return successResponse(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, 'Token refreshed successfully');

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Refresh token expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid refresh token', 401);
    }
    console.error('Refresh token error:', error);
    return errorResponse(res, 'Token refresh failed', 500);
  }
};

/**
 * POST /auth/forgot-password
 * Kirim link reset password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    if (!validateEmail(email)) {
      return errorResponse(res, 'Invalid email format', 400);
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Untuk keamanan, tetap return success meskipun email tidak ditemukan
      return successResponse(res, null, 'If email exists, reset link has been sent');
    }

    // Generate reset token
    const resetToken = generateResetToken(user.id);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Simpan reset token ke database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // TODO: Kirim email dengan reset link
    // Untuk sekarang, kita return token-nya (di production jangan return token!)
    console.log('Reset token for', email, ':', resetToken);

    return successResponse(res, {
      // Di production, jangan return reset token!
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    }, 'If email exists, reset link has been sent');

  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, 'Failed to process forgot password request', 500);
  }
};

/**
 * POST /auth/reset-password
 * Reset password dengan token
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return errorResponse(res, 'Token and new password are required', 400);
    }

    if (!validatePassword(newPassword)) {
      return errorResponse(res, 'Password must be at least 6 characters', 400);
    }

    // Verify reset token
    const decoded = verifyToken(token, process.env.JWT_SECRET);

    // Cari user dengan reset token yang valid
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token belum expired
        }
      }
    });

    if (!user) {
      return errorResponse(res, 'Invalid or expired reset token', 400);
    }

    // Hash password baru
    const hashedPassword = await hashPassword(newPassword);

    // Update password dan hapus reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        refreshToken: null // Logout dari semua device
      }
    });

    return successResponse(res, null, 'Password reset successful');

  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid or expired reset token', 400);
    }
    console.error('Reset password error:', error);
    return errorResponse(res, 'Password reset failed', 500);
  }
};