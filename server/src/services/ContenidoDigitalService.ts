import { ContenidoDigitalDTO } from '../dtos/ContenidoDigitalDTO';

export class ContenidoDigitalService {
  private imagenes: ContenidoDigitalDTO[] = [];
  private nextId = 1;

  obtenerTodasLasImagenes(): ContenidoDigitalDTO[] {
    return this.imagenes;
  }

  obtenerImagenPorId(id: number): ContenidoDigitalDTO | undefined {
    return this.imagenes.find((img) => img.id === id);
  }

  obtenerImagenesPorProducto(productoId: number): ContenidoDigitalDTO[] {
    return this.imagenes.filter((img) => img.productoId === productoId);
  }

  obtenerImagenesPorEtiqueta(etiqueta: string): ContenidoDigitalDTO[] {
    return this.imagenes.filter((img) =>
      img.etiquetas.some((e) => e.toLowerCase().includes(etiqueta.toLowerCase())),
    );
  }

  crearImagen(
    data: Omit<ContenidoDigitalDTO, 'id' | 'url' | 'fechaSubida'>,
    _file?: Express.Multer.File,
  ): ContenidoDigitalDTO {
    const id = this.nextId++;
    const nuevaImagen: ContenidoDigitalDTO = {
      id,
      ...data,
      url: `mock://placeholder-${id}`,
      fechaSubida: new Date(),
    };
    this.imagenes.push(nuevaImagen);
    return nuevaImagen;
  }

  actualizarImagen(
    id: number,
    data: Partial<ContenidoDigitalDTO>,
    _file?: Express.Multer.File,
  ): ContenidoDigitalDTO {
    const index = this.imagenes.findIndex((img) => img.id === id);
    if (index === -1) {
      throw new Error('Imagen no encontrada');
    }
    this.imagenes[index] = { ...this.imagenes[index], ...data };
    return this.imagenes[index];
  }

  eliminarImagen(id: number): boolean {
    const index = this.imagenes.findIndex((img) => img.id === id);
    if (index === -1) {
      return false;
    }
    this.imagenes.splice(index, 1);
    return true;
  }

  agregarEtiqueta(id: number, etiqueta: string): Promise<ContenidoDigitalDTO> {
    const imagen = this.obtenerImagenPorId(id);
    if (!imagen) {
      return Promise.reject(new Error('Imagen no encontrada'));
    }
    if (!imagen.etiquetas.includes(etiqueta)) {
      imagen.etiquetas.push(etiqueta);
    }
    return Promise.resolve(imagen);
  }

  eliminarEtiqueta(id: number, etiqueta: string): Promise<ContenidoDigitalDTO> {
    const imagen = this.obtenerImagenPorId(id);
    if (!imagen) {
      return Promise.reject(new Error('Imagen no encontrada'));
    }
    imagen.etiquetas = imagen.etiquetas.filter((e) => e !== etiqueta);
    return Promise.resolve(imagen);
  }
}
