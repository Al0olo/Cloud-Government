import { Router } from 'express';
import authRoutes from './auth.routes';
import applicationRoutes from './application.routes';
import documentRoutes from './document.routes';
import userRoutes from './user.routes';
// import adminRoutes from './admin.routes';
import { errorHandler } from '../middleware/error.middleware';
import { notFoundHandler } from '../middleware/not-found.middleware';

const router = Router();

// API Health Check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);
router.use('/documents', documentRoutes);
router.use('/users', userRoutes);
// router.use('/admin', adminRoutes);

// Handle 404
router.use(notFoundHandler);

// Handle errors
router.use(errorHandler);

export default router;