import { Request, Response } from 'express';
import { connection } from '../db';
export const getVentas = async (req: Request, res: Response) => {
  const [rows] = await connection.execute('SELECT * FROM ventas');
  res.json(rows);
};