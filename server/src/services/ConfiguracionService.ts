import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

interface ConfiguracionRow extends RowDataPacket {
  clave: string;
  valor: string;
}

export class ConfiguracionService {
  async get(clave: string): Promise<string | null> {
    const [rows] = await pool.query<ConfiguracionRow[]>(
      'SELECT clave, valor FROM configuracion WHERE clave = ?',
      [clave],
    );
    return rows.length > 0 ? rows[0].valor : null;
  }

  async set(clave: string, valor: string): Promise<void> {
    await pool.query(
      'INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
      [clave, valor],
    );
  }

  async getAll(): Promise<ConfiguracionRow[]> {
    const [rows] = await pool.query<ConfiguracionRow[]>(
      'SELECT clave, valor FROM configuracion',
    );
    return rows;
  }
}