const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno antes de importar el pool
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const { pool } = require('../config/database');

const createAdmin = async () => {
    const email = 'gabydeferro@gmail.com';
    const password = 'Paola30663296';
    const nombre = 'Administrador Gaby';
    const rol = 'admin';

    console.log(`Intentando crear el usuario administrador: ${email}`);
    console.log(`Conexión: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

    try {
        // Verificar si ya existe
        const [existing] = await pool.execute(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            console.log('⚠️ El usuario ya existe. Actualizando a rol admin...');
            await pool.execute(
                "UPDATE usuarios SET rol = 'admin' WHERE email = ?",
                [email]
            );
            console.log('✅ Rol actualizado exitosamente.');
            process.exit(0);
        }

        // Hashear contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insertar usuario
        const [result] = await pool.execute(
            `INSERT INTO usuarios (email, password_hash, nombre, rol, activo) 
             VALUES (?, ?, ?, ?, TRUE)`,
            [email, passwordHash, nombre, rol]
        );

        console.log(`✅ Usuario administrador creado con ID: ${result.insertId}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error al crear el usuario administrador:', error);
        process.exit(1);
    }
};

createAdmin();
