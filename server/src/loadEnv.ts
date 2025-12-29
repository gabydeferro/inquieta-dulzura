import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(__dirname, '../.env'); // Root is two levels up from src/index.ts, but one level up from src/ (where this file will be)
// Wait, if this is in src/loadEnv.ts:
// src/loadEnv.ts -> ../.env is root.
// Correct.

const fullPath = path.resolve(__dirname, '../../.env');
console.log('DEBUG: Cargando .env desde:', fullPath);
if (fs.existsSync(fullPath)) {
    console.log('DEBUG: Archivo .env EXISTE');
    const result = dotenv.config({ path: fullPath, override: true });
    if (result.error) {
        console.error('DEBUG: Error al cargar .env:', result.error);
    } else {
        console.log('DEBUG: .env Cargado correctamente. DB_PORT:', process.env.DB_PORT);
    }
} else {
    console.error('DEBUG: Archivo .env NO existe en:', fullPath);
    dotenv.config({ override: true });
}
