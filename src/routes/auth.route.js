import express from 'express';
import { 
  register, 
  login, 
  logout, 
  refreshToken, 
  forgotPassword, 
  resetPassword 
} from '../controllers/authController.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';

const router = express.Router();

// Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', optionalAuth, logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;