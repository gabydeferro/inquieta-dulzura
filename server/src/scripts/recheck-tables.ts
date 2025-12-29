
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import { pool } from '../config/database';

async function check() {
    try {
        console.log('--- START RECHECK ---');

        // Try to select 1 row or describe to verify existence and structure
        const tables = ['ingredientes', 'receta_ingrediente', 'receta_ingredientes']; // Trying both singular/plural

        for (const t of tables) {
            try {
                const [cols]: any = await pool.query(`DESCRIBE ${t}`);
                console.log(`Table '${t}' EXISTS. Columns:`);
                cols.forEach((c: any) => console.log(` - ${c.Field} (${c.Type})`));
            } catch (e: any) {
                console.log(`Table '${t}' NOT FOUND: ${e.message}`);
            }
        }

        console.log('--- END RECHECK ---');
    } catch (error) {
        console.error(error);
    }
    process.exit();
}
check();
