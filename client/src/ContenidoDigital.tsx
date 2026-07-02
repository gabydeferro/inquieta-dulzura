import React, { useState, useEffect } from 'react';
import api from './services/api';
import { contenidoDigitalCreateSchema } from './schemas/contenido-digital.schema';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useConfirm } from './contexts/ConfirmContext';
import { Image, Upload, Star, Trash2, X } from 'lucide-react';

interface Imagen {
  id: number;
  productoId: number;
  url: string;
  titulo: string;
  descripcion?: string;
  etiquetas: string[];
  fechaSubida: Date;
  tipo: 'imagen' | 'video';
}

interface ProductoOption {
  id: number;
  nombre: string;
}

export const ContenidoDigital: React.FC = () => {
  const confirm = useConfirm();
  const [imagenes, setImagenes] = useState<Imagen[]>([]);
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productos, setProductos] = useState<ProductoOption[]>([]);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProductoId, setUploadProductoId] = useState<string>('');
  const [uploadTitulo, setUploadTitulo] = useState('');

  const cargarImagenes = async () => {
    try {
      const response = await api.getContenidoDigital<Imagen[]>();
      setImagenes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await api.get<ProductoOption[]>('/productos');
      setProductos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  useEffect(() => {
    void cargarImagenes();
  }, []);

  useEffect(() => {
    if (showUploadModal) {
      void cargarProductos();
    }
  }, [showUploadModal]);

  const imagenesFiltradas = filtroEtiqueta
    ? imagenes.filter((img) =>
        img.etiquetas.some((e) => e.toLowerCase().includes(filtroEtiqueta.toLowerCase())),
      )
    : imagenes;

  const handleEliminar = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Eliminar imagen',
      message: '¿Estás seguro de eliminar esta imagen?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.deleteContenidoDigital(id);
      setImagenes(imagenes.filter((img) => img.id !== id));
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadProductoId('');
    setUploadTitulo('');
    setErrors({});
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Manual validation
    const fieldErrors: Record<string, string> = {};
    if (!uploadFile) fieldErrors.archivo = 'Debes seleccionar un archivo';
    if (!uploadProductoId) fieldErrors.productoId = 'Selecciona un producto';
    if (!uploadTitulo.trim()) fieldErrors.titulo = 'El título es requerido';

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('archivo', uploadFile!);
      formData.append('productoId', uploadProductoId);
      formData.append('titulo', uploadTitulo);
      formData.append('tipo', uploadFile!.type.startsWith('video/') ? 'video' : 'imagen');

      await api.createContenidoDigital(formData);
      setShowUploadModal(false);
      resetUploadForm();
      cargarImagenes();
    } catch (error) {
      console.error('Error al subir contenido:', error);
      setErrors({ submit: 'Error al subir el contenido' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Cargando contenido digital...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
            <Image className="size-7 sm:size-8 lg:size-9 text-brand-violet" />
            Contenido Digital
          </h1>
          <p className="text-muted-foreground">Gestión de fotos y videos de productos</p>
        </div>
        <Button onClick={() => { setShowUploadModal(true); resetUploadForm(); }}>
          <Upload className="size-4" />
          Subir contenido
        </Button>
      </header>

      {/* Filter */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Filtrar por etiqueta..."
          value={filtroEtiqueta}
          onChange={(e) => setFiltroEtiqueta(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {imagenesFiltradas.length === 0 ? (
          <p className="col-span-full py-12 text-center text-muted-foreground">
            No hay imágenes disponibles
          </p>
        ) : (
          imagenesFiltradas.map((imagen) => (
            <Card key={imagen.id} className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="aspect-video w-full overflow-hidden bg-muted">
                {imagen.tipo === 'imagen' ? (
                  <img
                    src={imagen.url}
                    alt={imagen.titulo}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video src={imagen.url} controls className="h-full w-full object-cover" />
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="mb-1 text-sm font-semibold text-foreground">{imagen.titulo}</h3>
                {imagen.descripcion && (
                  <p className="mb-2 text-xs text-muted-foreground">{imagen.descripcion}</p>
                )}
                <div className="mb-2 flex flex-wrap gap-1">
                  {imagen.etiquetas.map((etiqueta, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[0.6rem]">
                      {etiqueta}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => handleEliminar(imagen.id)}
                  className="w-full"
                >
                  <Trash2 className="size-3" />
                  Eliminar
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleUploadSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="size-5 text-brand-violet" />
                Subir Contenido
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* File */}
              <div className="grid gap-2">
                <Label htmlFor="archivo">Archivo *</Label>
                <Input
                  id="archivo"
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setUploadFile(file);
                    if (errors.archivo) setErrors((prev) => ({ ...prev, archivo: '' }));
                  }}
                  className={errors.archivo ? 'border-destructive' : ''}
                />
                {uploadFile && (
                  <p className="text-xs text-muted-foreground">{uploadFile.name}</p>
                )}
                {errors.archivo && (
                  <p className="text-xs text-destructive">{errors.archivo}</p>
                )}
              </div>

              {/* Producto */}
              <div className="grid gap-2">
                <Label htmlFor="productoId">Producto *</Label>
                <select
                  id="productoId"
                  value={uploadProductoId}
                  onChange={(e) => {
                    setUploadProductoId(e.target.value);
                    if (errors.productoId) setErrors((prev) => ({ ...prev, productoId: '' }));
                  }}
                  className={`h-8 w-full rounded-lg border ${errors.productoId ? 'border-destructive' : 'border-input'} bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`}
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                {errors.productoId && (
                  <p className="text-xs text-destructive">{errors.productoId}</p>
                )}
              </div>

              {/* Title */}
              <div className="grid gap-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={uploadTitulo}
                  onChange={(e) => {
                    setUploadTitulo(e.target.value);
                    if (errors.titulo) setErrors((prev) => ({ ...prev, titulo: '' }));
                  }}
                  placeholder="Título del contenido"
                  className={errors.titulo ? 'border-destructive' : ''}
                />
                {errors.titulo && (
                  <p className="text-xs text-destructive">{errors.titulo}</p>
                )}
              </div>

              {errors.submit && (
                <p className="text-xs text-destructive">{errors.submit}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Subiendo...' : 'Subir'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContenidoDigital;
