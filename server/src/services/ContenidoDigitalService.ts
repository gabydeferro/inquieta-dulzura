import { ContenidoDigitalDTO } from '../dtos/ContenidoDigitalDTO';

export class ContenidoDigitalService {
    private imagenes: ContenidoDigitalDTO[] = [];
    private nextId = 1;

    async obtenerTodasLasImagenes(): Promise<ContenidoDigitalDTO[]> {
        return this.imagenes;
    }

    async obtenerImagenPorId(id: number): Promise<ContenidoDigitalDTO | undefined> {
        return this.imagenes.find(img => img.id === id);
    }

    async obtenerImagenesPorProducto(productoId: number): Promise<ContenidoDigitalDTO[]> {
        return this.imagenes.filter(img => img.productoId === productoId);
    }

    async obtenerImagenesPorEtiqueta(etiqueta: string): Promise<ContenidoDigitalDTO[]> {
        return this.imagenes.filter(img =>
            img.etiquetas.some(e => e.toLowerCase().includes(etiqueta.toLowerCase()))
        );
    }

    async crearImagen(data: Omit<ContenidoDigitalDTO, 'id'>): Promise<ContenidoDigitalDTO> {
        const nuevaImagen: ContenidoDigitalDTO = {
            id: this.nextId++,
            ...data,
            fechaSubida: new Date()
        };
        this.imagenes.push(nuevaImagen);
        return nuevaImagen;
    }

    async actualizarImagen(id: number, data: Partial<ContenidoDigitalDTO>): Promise<ContenidoDigitalDTO> {
        const index = this.imagenes.findIndex(img => img.id === id);
        if (index === -1) {
            throw new Error('Imagen no encontrada');
        }
        this.imagenes[index] = { ...this.imagenes[index], ...data };
        return this.imagenes[index];
    }

    async eliminarImagen(id: number): Promise<void> {
        const index = this.imagenes.findIndex(img => img.id === id);
        if (index === -1) {
            throw new Error('Imagen no encontrada');
        }
        this.imagenes.splice(index, 1);
    }

    async agregarEtiqueta(id: number, etiqueta: string): Promise<ContenidoDigitalDTO> {
        const imagen = await this.obtenerImagenPorId(id);
        if (!imagen) {
            throw new Error('Imagen no encontrada');
        }
        if (!imagen.etiquetas.includes(etiqueta)) {
            imagen.etiquetas.push(etiqueta);
        }
        return imagen;
    }

    async eliminarEtiqueta(id: number, etiqueta: string): Promise<ContenidoDigitalDTO> {
        const imagen = await this.obtenerImagenPorId(id);
        if (!imagen) {
            throw new Error('Imagen no encontrada');
        }
        imagen.etiquetas = imagen.etiquetas.filter(e => e !== etiqueta);
        return imagen;
    }
}
