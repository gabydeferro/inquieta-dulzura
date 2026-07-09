import { Router, Response } from 'express';
import multer from 'multer';
import { ContenidoDigitalService } from '../services/ContenidoDigitalService';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types/express';

const router = Router();
const contenidoDigitalService = new ContenidoDigitalService();

// ── Multer configuration ────────────────────────
// memoryStorage because the file buffer is forwarded to Cloudinary upload_stream
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
  fileFilter: (_req, file, cb) => {
    const tiposPermitidos = [
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
    ];

    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo imágenes (GIF, JPEG, PNG, WebP) y videos (MP4, WebM).'));
    }
  },
});

// ── Routes ──────────────────────────────────────

/**
 * POST /api/contenido-digital
 * Create a new digital-content entry with file upload.
 * @access  Admin (authenticateToken + requireAdmin)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  upload.single('archivo'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No se proporcionó ningún archivo' });
        return;
      }

      const body = req.body as { productoId?: string; titulo?: string; descripcion?: string; tipo?: string; etiquetas?: string };
      const { productoId, titulo, descripcion, tipo, etiquetas } = body;

      if (!productoId || !titulo || !tipo) {
        res.status(400).json({ error: 'Faltan campos obligatorios: productoId, titulo, tipo' });
        return;
      }

      if (tipo !== 'imagen' && tipo !== 'video') {
        res.status(400).json({ error: 'tipo debe ser "imagen" o "video"' });
        return;
      }

      const result = await contenidoDigitalService.crearImagen({
        productoId: parseInt(productoId, 10),
        titulo,
        descripcion,
        tipo,
        url: '',
        fechaSubida: new Date(),
        etiquetas: etiquetas ? JSON.parse(etiquetas) as string[] : [],
      });

      res.status(201).json(result);
    } catch (error: unknown) {
      console.error('Error en POST /api/contenido-digital:', error);
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ error: message });
    }
  },
);

/**
 * GET /api/contenido-digital
 * List all content, optionally filtered by productoId or etiqueta.
 * @access  Public
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { productoId, etiqueta } = req.query as {
      productoId?: string;
      etiqueta?: string;
    };

    let result;

    if (productoId) {
      result = await contenidoDigitalService.obtenerImagenesPorProducto(parseInt(productoId, 10));
    } else if (etiqueta) {
      result = await contenidoDigitalService.obtenerImagenesPorEtiqueta(etiqueta);
    } else {
      result = await contenidoDigitalService.obtenerTodasLasImagenes();
    }

    res.json(result);
  } catch (error: unknown) {
    console.error('Error en GET /api/contenido-digital:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/contenido-digital/:id
 * Find by primary key.
 * @access  Public
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await contenidoDigitalService.obtenerImagenPorId(parseInt(req.params.id, 10));

    if (!result) {
      res.status(404).json({ error: 'Contenido digital no encontrado' });
      return;
    }

    res.json(result);
  } catch (error: unknown) {
    console.error('Error en GET /api/contenido-digital/:id:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    res.status(500).json({ error: message });
  }
});

/**
 * PUT /api/contenido-digital/:id
 * Update metadata and optionally replace the file.
 * @access  Admin
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  upload.single('archivo'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { titulo, descripcion, tipo, url } = req.body as {
        titulo?: string;
        descripcion?: string;
        tipo?: string;
        url?: string;
      };

      const updateData: Record<string, unknown> = {};
      if (titulo !== undefined) updateData.titulo = titulo;
      if (descripcion !== undefined) updateData.descripcion = descripcion;
      if (tipo !== undefined) {
        if (!['imagen', 'video'].includes(tipo)) {
          res.status(400).json({ error: 'tipo debe ser "imagen" o "video"' });
          return;
        }
        updateData.tipo = tipo;
      }
      if (url !== undefined) updateData.url = url;

      const result = await contenidoDigitalService.actualizarImagen(id, updateData);

      if (!result) {
        res.status(404).json({ error: 'Contenido digital no encontrado' });
        return;
      }

      res.json(result);
    } catch (error: unknown) {
      console.error('Error en PUT /api/contenido-digital/:id:', error);
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ error: message });
    }
  },
);

/**
 * DELETE /api/contenido-digital/:id
 * Delete an entry (destroys Cloudinary resource when applicable).
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const exists = await contenidoDigitalService.obtenerImagenPorId(id);
      if (!exists) {
        res.status(404).json({ error: 'Contenido digital no encontrado' });
        return;
      }

      contenidoDigitalService.eliminarImagen(id);

      res.status(204).send();
    } catch (error: unknown) {
      console.error('Error en DELETE /api/contenido-digital/:id:', error);
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ error: message });
    }
  },
);

export default router;
