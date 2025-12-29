import { Request, Response } from 'express';
import { connection } from '../db';
export const getInventario = async (req: Request, res: Response) => {
  const [rows] = await connection.execute('SELECT * FROM categorias');
  res.json(rows);
};