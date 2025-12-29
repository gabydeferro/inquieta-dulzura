export interface ContenidoDigitalDTO {
    id: number;
    productoId: number;
    url: string;
    titulo: string;
    descripcion?: string;
    etiquetas: string[];
    fechaSubida: Date;
    tipo: 'imagen' | 'video';
    tamaño?: number;
}
