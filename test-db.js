const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env', override: true });

async function test() {
    console.log('Testing connection with:');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Pass:', process.env.DB_PASSWORD ? '******' : '(empty)');
    console.log('DB:', process.env.DB_NAME);
    console.log('Port:', process.env.DB_PORT);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '3306')
        });
        console.log('✅ Success!');
        await connection.end();
    } catch (err) {
        console.error('❌ Failed!');
        console.error(err);
    }
}

test();
