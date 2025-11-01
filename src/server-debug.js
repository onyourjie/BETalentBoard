import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env first
dotenv.config();

console.log('Starting server...');
console.log('Environment variables loaded');

try {
  // Import routes
  console.log('Importing routes...');
  const authRoutes = await import('./routes/auth.route.js');
  const userRoutes = await import('./routes/user.route.js');
  console.log('Routes imported successfully');

  const app = express();
  const PORT = process.env.PORT || 5000;

  // Get __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  console.log('🔧 Setting up middleware...');

  // Middleware Setup
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Static files untuk avatar
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  console.log('Middleware setup complete');

  // Routes
  console.log('Setting up routes...');
  app.use('/api/auth', authRoutes.default);
  app.use('/api/users', userRoutes.default);

  // Health check route
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'BETalentBoard API is running!',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users'
      }
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.originalUrl
    });
  });

  // Error handler
  app.use((error, req, res, next) => {
    console.error('🐛 Error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB'
      });
    }

    if (error.message === 'Only image files are allowed!') {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed for avatar upload'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  });

  console.log('Routes setup complete');

  // Start server
  console.log('Starting HTTP server...');
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Server started successfully!');
  });

} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}