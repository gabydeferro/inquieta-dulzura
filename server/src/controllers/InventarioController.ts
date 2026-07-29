import { Request, Response } from 'express';
import { pool } from '../config/database';
export const getInventario = async (req: Request, res: Response) => {
  const [rows] = await pool.execute('SELECT * FROM categorias');
  res.json(rows);
};
