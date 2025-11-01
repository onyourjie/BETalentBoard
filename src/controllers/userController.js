import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { successResponse, errorResponse, validateEmail, validatePassword } from '../utils/helpers.js';
import multer from 'multer';
import path from 'path';

/**
 * GET /users
 * Ambil daftar semua user (admin only)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where condition
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    // Get users dengan pagination
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(totalUsers / take);

    return successResponse(res, {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }, 'Users retrieved successfully');

  } catch (error) {
    console.error('Get all users error:', error);
    return errorResponse(res, 'Failed to retrieve users', 500);
  }
};

/**
 * GET /users/:id
 * Ambil data user tertentu
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah user bisa akses profile ini
    // Admin bisa akses semua, user biasa hanya bisa akses profile sendiri
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return errorResponse(res, 'Access denied', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, { user }, 'User retrieved successfully');

  } catch (error) {
    console.error('Get user by ID error:', error);
    return errorResponse(res, 'Failed to retrieve user', 500);
  }
};

/**
 * PUT /users/:id
 * Update data user
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, role, isActive } = req.body;

    // Cek permission
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Non-admin tidak bisa ubah role dan isActive
    const updateData = { name, username };
    
    if (email && validateEmail(email)) {
      updateData.email = email;
    }

    // Hanya admin yang bisa update role dan isActive
    if (req.user.role === 'ADMIN') {
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
    }

    // Cek apakah email/username sudah dipakai user lain
    if (email || username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } }, // Bukan user yang sedang diupdate
            {
              OR: [
                email ? { email } : {},
                username ? { username } : {}
              ].filter(condition => Object.keys(condition).length > 0)
            }
          ]
        }
      });

      if (existingUser) {
        const field = existingUser.email === email ? 'Email' : 'Username';
        return errorResponse(res, `${field} already taken`, 400);
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        updatedAt: true,
      }
    });

    return successResponse(res, { user }, 'User updated successfully');

  } catch (error) {
    if (error.code === 'P2025') {
      return errorResponse(res, 'User not found', 404);
    }
    console.error('Update user error:', error);
    return errorResponse(res, 'Failed to update user', 500);
  }
};

/**
 * DELETE /users/:id
 * Hapus user
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Hanya admin yang bisa delete user
    if (req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Access denied', 403);
    }

    // Tidak bisa delete diri sendiri
    if (req.user.id === id) {
      return errorResponse(res, 'Cannot delete your own account', 400);
    }

    await prisma.user.delete({
      where: { id }
    });

    return successResponse(res, null, 'User deleted successfully');

  } catch (error) {
    if (error.code === 'P2025') {
      return errorResponse(res, 'User not found', 404);
    }
    console.error('Delete user error:', error);
    return errorResponse(res, 'Failed to delete user', 500);
  }
};

/**
 * GET /users/me
 * Ambil profil user yang sedang login
 */
export const getMyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, { user }, 'Profile retrieved successfully');

  } catch (error) {
    console.error('Get my profile error:', error);
    return errorResponse(res, 'Failed to retrieve profile', 500);
  }
};

/**
 * PATCH /users/me/password
 * Ubah password dari profil sendiri
 */
export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400);
    }

    if (!validatePassword(newPassword)) {
      return errorResponse(res, 'New password must be at least 6 characters', 400);
    }

    // Ambil user dengan password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password dan clear refresh token (logout dari semua device)
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        password: hashedNewPassword,
        refreshToken: null
      }
    });

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return successResponse(res, null, 'Password changed successfully. Please login again.');

  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(res, 'Failed to change password', 500);
  }
};

// Setup multer untuk upload avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * PATCH /users/me/avatar
 * Ubah foto profil
 */
export const updateMyAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Avatar image is required', 400);
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // Update avatar di database
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarPath },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
      }
    });

    return successResponse(res, { user }, 'Avatar updated successfully');

  } catch (error) {
    console.error('Update avatar error:', error);
    return errorResponse(res, 'Failed to update avatar', 500);
  }
};