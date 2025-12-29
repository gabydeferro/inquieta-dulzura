import { Router } from 'express';
import multer from 'multer';
import fotoController from '../controllers/FotoController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Configurar multer para manejar archivos en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'));
        }
    }
});

/**
 * @route   POST /api/fotos/upload
 * @desc    Subir una foto de producto
 * @access  Private
 */
router.post('/upload', authenticateToken, requireAdmin, upload.single('foto'), fotoController.subirFoto);

/**
 * @route   GET /api/fotos/producto/:producto_id
 * @desc    Obtener todas las fotos de un producto
 * @access  Public
 */
router.get('/producto/:producto_id', fotoController.obtenerFotosProducto);

/**
 * @route   GET /api/fotos/producto/:producto_id/principal
 * @desc    Obtener la foto principal de un producto
 * @access  Public
 */
router.get('/producto/:producto_id/principal', fotoController.obtenerFotoPrincipal);

/**
 * @route   PUT /api/fotos/:foto_id/principal
 * @desc    Establecer una foto como principal
 * @access  Private
 */
router.put('/:foto_id/principal', authenticateToken, requireAdmin, fotoController.establecerPrincipal);

/**
 * @route   DELETE /api/fotos/:foto_id
 * @desc    Eliminar una foto
 * @access  Private
 */
router.delete('/:foto_id', authenticateToken, requireAdmin, fotoController.eliminarFoto);

/**
 * @route   PUT /api/fotos/producto/:producto_id/reordenar
 * @desc    Reordenar fotos de un producto
 * @access  Private
 */
router.put('/producto/:producto_id/reordenar', authenticateToken, requireAdmin, fotoController.reordenarFotos);

/**
 * @route   GET /api/fotos/estadisticas
 * @desc    Obtener estadísticas de almacenamiento
 * @access  Private
 */
router.get('/estadisticas', authenticateToken, requireAdmin, fotoController.obtenerEstadisticas);

/**
 * @route   POST /api/fotos/limpiar-huerfanos
 * @desc    Limpiar archivos huérfanos
 * @access  Private
 */
router.post('/limpiar-huerfanos', authenticateToken, requireAdmin, fotoController.limpiarHuerfanos);

export default router;
