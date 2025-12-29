import { connection } from '../db';
import { RecetaDTO, CreateRecetaDTO, UpdateRecetaDTO, RecetaIngredienteDTO } from '../dtos/RecetasDTO';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class RecetaService {

    async getAll(): Promise<RecetaDTO[]> {
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM recetas WHERE activo = true ORDER BY nombre ASC');
        return rows as RecetaDTO[];
    }

    async getById(id: number): Promise<RecetaDTO | null> {
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM recetas WHERE id = ?', [id]);
        if (rows.length === 0) {
            return null;
        }
        const receta = rows[0] as RecetaDTO;

        // Fetch ingredients
        const [ingredientes] = await connection.query<RowDataPacket[]>(`
        SELECT 
            ri.ingrediente_id, 
            ri.cantidad, 
            ri.unidad_medida, 
            ri.notas,
            i.nombre,
            i.descripcion,
            i.costo_unitario
        FROM receta_ingrediente ri
        JOIN ingredientes i ON ri.ingrediente_id = i.id
        WHERE ri.receta_id = ?
    `, [id]);

        receta.ingredientes = ingredients.map((row: any) => ({
            ingrediente_id: row.ingrediente_id,
            cantidad: row.cantidad,
            unidad_medida: row.unidad_medida,
            notas: row.notas,
            ingrediente: {
                id: row.ingrediente_id,
                nombre: row.nombre,
                descripcion: row.descripcion,
                unidad_medida: row.unidad_medida, // Unit from catalog, might differ from recipe unit logic if needed, but for now passing it
                costo_unitario: row.costo_unitario,
                activo: true // Assumption
            }
        })) as RecetaIngredienteDTO[];

        return receta;
    }

    async create(data: CreateRecetaDTO): Promise<RecetaDTO> {
        const conn = await connection.getConnection();
        try {
            await conn.beginTransaction();

            const { nombre, descripcion, instrucciones, tiempo_preparacion, porciones, ingredientes } = data;
            const [result] = await conn.query<ResultSetHeader>(
                'INSERT INTO recetas (nombre, descripcion, instrucciones, tiempo_preparacion, porciones) VALUES (?, ?, ?, ?, ?)',
                [nombre, descripcion || null, instrucciones || null, tiempo_preparacion || null, porciones || null]
            );
            const recetaId = result.insertId;

            if (ingredientes && ingredientes.length > 0) {
                const values = ingredientes.map(ing => [
                    recetaId, ing.ingrediente_id, ing.cantidad, ing.unidad_medida, ing.notas || null
                ]);
                await conn.query(
                    'INSERT INTO receta_ingrediente (receta_id, ingrediente_id, cantidad, unidad_medida, notas) VALUES ?',
                    [values]
                );
            }

            await conn.commit();
            return (await this.getById(recetaId))!;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async update(id: number, data: UpdateRecetaDTO): Promise<RecetaDTO | null> {
        const conn = await connection.getConnection();
        try {
            await conn.beginTransaction();

            const receta = await this.getById(id); // Check existence
            if (!receta) {
                conn.release();
                return null;
            }

            const updatedReceta = { ...receta, ...data };

            await conn.query(
                'UPDATE recetas SET nombre = ?, descripcion = ?, instrucciones = ?, tiempo_preparacion = ?, porciones = ?, activo = ? WHERE id = ?',
                [
                    updatedReceta.nombre,
                    updatedReceta.descripcion,
                    updatedReceta.instrucciones,
                    updatedReceta.tiempo_preparacion,
                    updatedReceta.porciones,
                    updatedReceta.activo,
                    id
                ]
            );

            if (data.ingredientes) {
                // Replace strategy: Delete all and re-insert
                await conn.query('DELETE FROM receta_ingrediente WHERE receta_id = ?', [id]);

                if (data.ingredientes.length > 0) {
                    const values = data.ingredientes.map(ing => [
                        id, ing.ingrediente_id, ing.cantidad, ing.unidad_medida, ing.notas || null
                    ]);
                    await conn.query(
                        'INSERT INTO receta_ingrediente (receta_id, ingrediente_id, cantidad, unidad_medida, notas) VALUES ?',
                        [values]
                    );
                }
            }

            await conn.commit();
            return (await this.getById(id))!;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async delete(id: number): Promise<boolean> {
        const [result] = await connection.query<ResultSetHeader>('DELETE FROM recetas WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}
