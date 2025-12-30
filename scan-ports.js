import { createConnection } from 'mysql2/promise';
const fs = require('fs');
import 'dotenv/config';

async function testPort(port) {
    console.log(`Probando puerto ${port}...`);
    try {
        const connection = await createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'inquieta_dulzura',
            port: port,
            connectTimeout: 2000 // Ahorrar tiempo
        });
        console.log(`✅ EXITO en puerto ${port}`);
        await connection.end();
        return true;
    } catch (err) {
        console.log(`❌ FALLO en puerto ${port}: ${err.message}`);
        return false;
    }
}

async function runTests() {
    let log = 'Iniciando escaneo de puertos MySQL (3306, 3307, 3308)...\n';
    const ports = [3306, 3307, 3308];
    let found = false;

    for (const port of ports) {
        const success = await testPort(port);
        log += `Puerto ${port}: ${success ? 'EXITO' : 'FALLO'}\n`;
        if (success) {
            log += `CONSEJO: Cambia DB_PORT=${port} en tu .env\n`;
            found = true;
        }
    }

    if (!found) {
        log += 'No se encontro conexion en los puertos habituales.\n';
    }

    fs.writeFileSync('db-scan-result.txt', log, 'utf8');
    process.exit(found ? 0 : 1);
}

runTests();
