import { connection } from '../db';
export const getRecetas = async () => {
  const [rows] = await connection.execute('SELECT * FROM recetas');
  return rows;
};