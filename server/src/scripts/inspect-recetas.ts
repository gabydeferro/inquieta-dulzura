
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import { pool } from '../config/database';

async function check() {
    try {
        console.log('--- START CHECK ---');
        try {
            const [recetas]: any = await pool.query('DESCRIBE recetas');
            console.log('Table recetas exists. Columns:');
            recetas.forEach((c: any) => console.log(' - ' + c.Field + ' (' + c.Type + ')'));
        } catch (e: any) {
            console.log('Table recetas DOES NOT EXIST (' + e.message + ')');
        }

        try {
            const [ingredientes]: any = await pool.query('DESCRIBE ingredientes');
            console.log('Table ingredientes exists. Columns:');
            ingredientes.forEach((c: any) => console.log(' - ' + c.Field + ' (' + c.Type + ')'));
        } catch (e: any) {
            console.log('Table ingredientes DOES NOT EXIST (' + e.message + ')');
        }

        try {
            // Check for likely association table names
            const [ri]: any = await pool.query('DESCRIBE receta_ingredientes');
            console.log('Table receta_ingredientes exists. Columns:');
            ri.forEach((c: any) => console.log(' - ' + c.Field + ' (' + c.Type + ')'));
        } catch (e: any) {
            console.log('Table receta_ingredientes DOES NOT EXIST');
        }

        console.log('--- END CHECK ---');
    } catch (error) {
        console.error(error);
    }
    process.exit();
}
check();
