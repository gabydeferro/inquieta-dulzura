import { pool } from '../config/database';
export const getInventario = async () => {
  const [rows] = await pool.execute('SELECT * FROM categorias');
  return rows;
};
