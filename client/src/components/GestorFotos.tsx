import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Camera, Upload, Star, Trash2 } from 'lucide-react';

interface Foto {
  id: number;
  producto_id: number;
  nombre_archivo: string;
  url_publica: string;
  tamano_bytes: number;
  ancho_px?: number;
  alto_px?: number;
  es_principal: boolean;
  orden: number;
}

interface Estadisticas {
  total_fotos: number;
  tamano_total_mb: number;
  promedio_kb: number;
}

interface Props {
  productoId: number;
}

export const GestorFotos: React.FC<Props> = ({ productoId }) => {
  const confirm = useConfirm();
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // AlertDialog state
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertDialogConfig, setAlertDialogConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const API_URL = '/api/fotos';

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  };

  const cargarFotos = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/producto/${productoId}`);
      const data = await response.json();
      setFotos(data);
    } catch (error) {
      console.error('Error al cargar fotos:', error);
      mostrarMensaje('error', 'Error al cargar las fotos');
    }
  }, [productoId]);

  const cargarEstadisticas = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/estadisticas`);
      const data = await response.json();
      setEstadisticas(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }, []);

  useEffect(() => {
    cargarFotos();
    cargarEstadisticas();
  }, [cargarFotos, cargarEstadisticas]);

  const handleSubirFoto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('producto_id', productoId.toString());

    setCargando(true);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const resultado = await response.json();

      if (resultado.success) {
        mostrarMensaje('success', 'Foto subida exitosamente');
        cargarFotos();
        cargarEstadisticas();
        form.reset();
      } else {
        mostrarMensaje('error', resultado.message);
      }
    } catch (error) {
      console.error('Error al subir foto:', error);
      mostrarMensaje('error', 'Error al subir la foto');
    } finally {
      setCargando(false);
    }
  };

  const handleEstablecerPrincipal = async (fotoId: number) => {
    setAlertDialogConfig({
      title: 'Establecer como principal',
      message: '¿Establecer esta foto como principal?',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/${fotoId}/principal`, {
            method: 'PUT',
          });
          const resultado = await response.json();
          if (resultado.success) {
            mostrarMensaje('success', 'Foto principal actualizada');
            cargarFotos();
          } else {
            mostrarMensaje('error', resultado.message);
          }
        } catch (error) {
          console.error('Error:', error);
          mostrarMensaje('error', 'Error al actualizar foto principal');
        }
      },
    });
    setAlertDialogOpen(true);
  };

  const handleEliminarFoto = async (fotoId: number) => {
    setAlertDialogConfig({
      title: 'Eliminar foto',
      message: '¿Estás seguro de eliminar esta foto? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/${fotoId}`, {
            method: 'DELETE',
          });
          const resultado = await response.json();
          if (resultado.success) {
            mostrarMensaje('success', 'Foto eliminada exitosamente');
            cargarFotos();
            cargarEstadisticas();
          } else {
            mostrarMensaje('error', resultado.message);
          }
        } catch (error) {
          console.error('Error:', error);
          mostrarMensaje('error', 'Error al eliminar la foto');
        }
      },
    });
    setAlertDialogOpen(true);
  };

  const showAlertDialog = (title: string, message: string, onConfirm: () => void) => {
    setAlertDialogConfig({ title, message, onConfirm });
    setAlertDialogOpen(true);
  };

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
          <Camera className="size-7 sm:size-8 lg:size-9 text-brand-violet" />
          Gestor de Fotos
        </h1>
        <p className="text-sm text-muted-foreground">Producto ID: {productoId}</p>
      </div>

      {/* Alert Messages */}
      {mensaje && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm ${
            mensaje.tipo === 'success'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Stats */}
      {estadisticas && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="bg-gradient-to-br from-brand-violet to-brand-violet/80 text-white">
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-3xl font-bold text-white">
                {estadisticas.total_fotos}
              </CardTitle>
              <p className="text-xs font-medium text-white/80">Total de Fotos</p>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-to-br from-brand-violet to-brand-violet/80 text-white">
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-3xl font-bold text-white">
                {estadisticas.tamano_total_mb.toFixed(2)} MB
              </CardTitle>
              <p className="text-xs font-medium text-white/80">Espacio Usado</p>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-to-br from-brand-violet to-brand-violet/80 text-white">
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-3xl font-bold text-white">
                {estadisticas.promedio_kb.toFixed(2)} KB
              </CardTitle>
              <p className="text-xs font-medium text-white/80">Promedio por Foto</p>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Upload Form */}
      <div className="mb-8 rounded-xl border-2 border-dashed border-brand-violet/50 bg-muted/30 p-6">
        <form onSubmit={handleSubirFoto}>
          <div className="mb-4 text-center">
            <Upload className="mx-auto mb-3 size-12 text-brand-violet" />
            <h3 className="mb-1 text-lg font-semibold text-foreground">Selecciona una imagen</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Formatos: JPG, PNG, WEBP, GIF (máx 5MB)
            </p>
            <Input
              type="file"
              name="foto"
              accept="image/*"
              required
              disabled={cargando}
              className="mx-auto max-w-xs"
            />
          </div>

          <div className="text-center">
            <Label className="mb-3 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="es_principal" value="1" className="rounded" />
              Establecer como foto principal
            </Label>
            <br />
            <Button type="submit" disabled={cargando} className="mt-3">
              <Upload className="size-4" />
              {cargando ? 'Subiendo...' : 'Subir Foto'}
            </Button>
          </div>
        </form>
      </div>

      {/* Gallery */}
      <h2 className="mb-4 text-xl font-bold text-foreground">Galería de Fotos</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {fotos.length === 0 ? (
          <p className="col-span-full py-12 text-center text-muted-foreground">
            No hay fotos aún. ¡Sube la primera!
          </p>
        ) : (
          fotos.map((foto) => (
            <Card key={foto.id} className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="relative">
                <img
                  src={foto.url_publica}
                  alt={foto.nombre_archivo}
                  className="h-60 w-full object-cover"
                />
                {foto.es_principal && (
                  <div className="absolute right-2 top-2 rounded-full bg-brand-violet px-3 py-1 text-xs font-bold text-white shadow">
                    PRINCIPAL
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <p className="mb-1 text-sm font-semibold text-foreground truncate">
                  {foto.nombre_archivo}
                </p>
                <p className="mb-3 text-xs text-muted-foreground">
                  {foto.ancho_px} × {foto.alto_px} px
                  <br />
                  {(foto.tamano_bytes / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="flex gap-2">
                  {!foto.es_principal && (
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => handleEstablecerPrincipal(foto.id)}
                      className="flex-1"
                    >
                      <Star className="size-3" />
                      Principal
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => handleEliminarFoto(foto.id)}
                    className="flex-1"
                  >
                    <Trash2 className="size-3" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* AlertDialog for confirmations */}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialogConfig?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialogConfig?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (alertDialogConfig?.onConfirm) {
                  alertDialogConfig.onConfirm();
                }
                setAlertDialogOpen(false);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GestorFotos;
