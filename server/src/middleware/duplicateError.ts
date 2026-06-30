import { Response } from 'express';

export const handleDuplicateError = (error: unknown, res: Response, message: string): boolean => {
  const mysqlError = error as { code?: string; errno?: number };
  if (mysqlError.code === 'ER_DUP_ENTRY' || mysqlError.errno === 1062) {
    res.status(409).json({ success: false, error: message });
    return true;
  }
  return false;
};
