import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import { pool } from '../config/database';

async function checkDB() {
    try {
        const [rows]: any = await pool.query('SHOW TABLES');
        const tables = rows.map((r: any) => Object.values(r)[0]);
        console.log('TABLES_START');
        tables.forEach((t: string) => console.log('TABLE:' + t));
        console.log('TABLES_END');
    } catch (error: any) {
        console.log('DB_ERROR:' + error.message);
    } finally {
        process.exit();
    }
}

checkDB();
