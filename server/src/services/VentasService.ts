import { connection } from '../db';
export const getVentas = async () => {
  const [rows] = await connection.execute('SELECT * FROM ventas');
  return rows;
};