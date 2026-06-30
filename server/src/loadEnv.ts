import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// src/loadEnv.ts -> ../.env is root.
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
