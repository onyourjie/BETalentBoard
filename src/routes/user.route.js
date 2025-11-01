import express from 'express';
import { 
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMyProfile,
  changeMyPassword,
  updateMyAvatar,
  upload
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// User Management Routes

// Routes yang butuh authentication
router.use(authenticate);

// Get my profile - semua user yang login bisa akses
router.get('/me', getMyProfile);

// Change my password - semua user yang login bisa akses
router.patch('/me/password', changeMyPassword);

// Update my avatar - semua user yang login bisa akses
router.patch('/me/avatar', upload.single('avatar'), updateMyAvatar);

// Admin only routes
router.get('/', authorize(['ADMIN']), getAllUsers);
router.delete('/:id', authorize(['ADMIN']), deleteUser);

// Get user by ID - admin atau user itu sendiri
router.get('/:id', getUserById);

// Update user - admin atau user itu sendiri
router.put('/:id', updateUser);

export default router;