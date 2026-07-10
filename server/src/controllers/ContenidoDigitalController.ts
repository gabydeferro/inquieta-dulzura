import express, { Request, Response } from 'express';
import { ContenidoDigitalService } from '../services/ContenidoDigitalService';
import { ContenidoDigitalDTO } from '../dtos/ContenidoDigitalDTO';

const router = express.Router();
const contenidoDigitalService = new ContenidoDigitalService();

// GET /api/contenido-digital - Obtener todas las imágenes
router.get('/', async (_req: Request, res: Response) => {
  try {
    const imagenes = await contenidoDigitalService.obtenerTodasLasImagenes();
    res.json(imagenes);
  } catch {
    res.status(500).json({ error: 'Error al obtener imágenes' });
  }
});

// GET /api/contenido-digital/:id - Obtener imagen por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const imagen = await contenidoDigitalService.obtenerImagenPorId(parseInt(req.params.id));
    if (!imagen) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }
    res.json(imagen);
  } catch {
    res.status(500).json({ error: 'Error al obtener imagen' });
  }
});

// POST /api/contenido-digital - Crear nueva imagen
router.post('/', async (req: Request, res: Response) => {
  try {
    const nuevaImagen = await contenidoDigitalService.crearImagen(
      req.body as Omit<ContenidoDigitalDTO, 'id'>,
    );
    res.status(201).json(nuevaImagen);
  } catch {
    res.status(500).json({ error: 'Error al crear imagen' });
  }
});

// PUT /api/contenido-digital/:id - Actualizar imagen
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const imagenActualizada = await contenidoDigitalService.actualizarImagen(
      parseInt(req.params.id),
      req.body as Partial<ContenidoDigitalDTO>,
    );
    res.json(imagenActualizada);
  } catch {
    res.status(500).json({ error: 'Error al actualizar imagen' });
  }
});

// DELETE /api/contenido-digital/:id - Eliminar imagen
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await contenidoDigitalService.eliminarImagen(parseInt(req.params.id));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar imagen' });
  }
});

export default router;
