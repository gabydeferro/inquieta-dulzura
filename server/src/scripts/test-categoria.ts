
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import { CategoriaService } from '../services/CategoriaService';

async function testCreate() {
    const service = new CategoriaService();
    try {
        console.log('Attempting to create category...');
        const nueva = await service.create({
            nombre: 'Test ' + Date.now(),
            descripcion: 'Test Description'
        });
        console.log('Success:', nueva);
    } catch (error: any) {
        console.error('FAILED:', error.message);
        if (error.sql) console.error('SQL:', error.sql);
        if (error.stack) console.error('STACK:', error.stack);
    } finally {
        process.exit();
    }
}

testCreate();
