import { connection } from '../db';
export const getInventario = async () => {
  const [rows] = await connection.execute('SELECT * FROM categorias');
  return rows;
};