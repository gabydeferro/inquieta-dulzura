import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getClientes = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre FROM clientes WHERE activo = TRUE ORDER BY nombre',
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al cargar clientes';
    res.status(500).json({ success: false, error: message });
  }
};
