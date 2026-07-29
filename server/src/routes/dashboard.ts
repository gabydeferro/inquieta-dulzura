import { Router } from 'express';
import { getDashboardStats } from '../controllers/DashboardController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticateToken, requireAdmin, getDashboardStats);

export default router;
