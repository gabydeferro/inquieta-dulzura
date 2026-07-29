import { RowDataPacket } from 'mysql2';
import { pool } from './database';

interface CountResult extends RowDataPacket {
  count: number;
}

export async function initConfig(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    // Create configuracion table if not exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        clave VARCHAR(100) PRIMARY KEY,
        valor VARCHAR(255) NOT NULL
      )
    `);

    // Check if table is empty
    const [rows] = await conn.query<CountResult[]>('SELECT COUNT(*) as count FROM configuracion');
    const count = rows[0].count;

    if (count === 0) {
      // Seed default values
      await conn.query(
        "INSERT IGNORE INTO configuracion (clave, valor) VALUES ('stock_bajo_threshold', '10')",
      );
      console.log('✅ Configuracion table seeded with default stock_bajo_threshold=10');
    }
  } finally {
    conn.release();
  }
}
