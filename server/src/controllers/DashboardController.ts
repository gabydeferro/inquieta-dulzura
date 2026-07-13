import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';

const dashboardService = new DashboardService();

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getStats();
    res.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load dashboard data';
    res.status(500).json({ success: false, error: message });
  }
};