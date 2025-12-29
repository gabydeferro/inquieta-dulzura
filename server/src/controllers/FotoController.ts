import { Request, Response } from 'express';
import { FotoService } from '../services/FotoService';

const fotoService = new FotoService();

export class FotoController {
    /**
     * POST /api/fotos/upload
     * Subir una foto de producto
     */
    async subirFoto(req: Request, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'No se proporcionó ningún archivo'
                });
                return;
            }

            const { producto_id, es_principal } = req.body;

            if (!producto_id) {
                res.status(400).json({
                    success: false,
                    message: 'Falta el ID del producto'
                });
                return;
            }

            const resultado = await fotoService.subirFoto({
                producto_id: parseInt(producto_id),
                archivo: req.file,
                es_principal: es_principal === 'true' || es_principal === '1'
            });

            res.status(resultado.success ? 200 : 400).json(resultado);

        } catch (error) {
            console.error('Error en subirFoto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * GET /api/fotos/producto/:producto_id
     * Obtener todas las fotos de un producto
     */
    async obtenerFotosProducto(req: Request, res: Response): Promise<void> {
        try {
            const { producto_id } = req.params;

            if (!producto_id) {
                res.status(400).json({
                    success: false,
                    message: 'Falta el ID del producto'
                });
                return;
            }

            const fotos = await fotoService.obtenerFotosProducto(parseInt(producto_id));
            res.json(fotos);

        } catch (error) {
            console.error('Error en obtenerFotosProducto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * GET /api/fotos/producto/:producto_id/principal
     * Obtener la foto principal de un producto
     */
    async obtenerFotoPrincipal(req: Request, res: Response): Promise<void> {
        try {
            const { producto_id } = req.params;

            if (!producto_id) {
                res.status(400).json({
                    success: false,
                    message: 'Falta el ID del producto'
                });
                return;
            }

            const foto = await fotoService.obtenerFotoPrincipal(parseInt(producto_id));

            if (foto) {
                res.json(foto);
            } else {
                res.status(404).json({
                    success: false,
                    message: 'No se encontró foto principal'
                });
            }

        } catch (error) {
            console.error('Error en obtenerFotoPrincipal:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * PUT /api/fotos/:foto_id/principal
     * Establecer una foto como principal
     */
    async establecerPrincipal(req: Request, res: Response): Promise<void> {
        try {
            const { foto_id } = req.params;

            if (!foto_id) {
                res.status(400).json({
                    success: false,
                    message: 'Falta el ID de la foto'
                });
                return;
            }

            const resultado = await fotoService.establecerPrincipal(parseInt(foto_id));
            res.status(resultado.success ? 200 : 400).json(resultado);

        } catch (error) {
            console.error('Error en establecerPrincipal:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * DELETE /api/fotos/:foto_id
     * Eliminar una foto
     */
    async eliminarFoto(req: Request, res: Response): Promise<void> {
        try {
            const { foto_id } = req.params;

            if (!foto_id) {
                res.status(400).json({
                    success: false,
                    message: 'Falta el ID de la foto'
                });
                return;
            }

            const resultado = await fotoService.eliminarFoto(parseInt(foto_id));
            res.status(resultado.success ? 200 : 400).json(resultado);

        } catch (error) {
            console.error('Error en eliminarFoto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * PUT /api/fotos/producto/:producto_id/reordenar
     * Reordenar fotos de un producto
     */
    async reordenarFotos(req: Request, res: Response): Promise<void> {
        try {
            const { producto_id } = req.params;
            const { orden } = req.body;

            if (!producto_id || !orden || !Array.isArray(orden)) {
                res.status(400).json({
                    success: false,
                    message: 'Parámetros inválidos'
                });
                return;
            }

            const resultado = await fotoService.reordenarFotos(
                parseInt(producto_id),
                orden
            );

            res.status(resultado.success ? 200 : 400).json(resultado);

        } catch (error) {
            console.error('Error en reordenarFotos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * GET /api/fotos/estadisticas
     * Obtener estadísticas de almacenamiento
     */
    async obtenerEstadisticas(req: Request, res: Response): Promise<void> {
        try {
            const stats = await fotoService.obtenerEstadisticas();
            res.json(stats);

        } catch (error) {
            console.error('Error en obtenerEstadisticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * POST /api/fotos/limpiar-huerfanos
     * Limpiar archivos huérfanos
     */
    async limpiarHuerfanos(req: Request, res: Response): Promise<void> {
        try {
            const resultado = await fotoService.limpiarArchivosHuerfanos();
            res.json(resultado);

        } catch (error) {
            console.error('Error en limpiarHuerfanos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

export default new FotoController();
