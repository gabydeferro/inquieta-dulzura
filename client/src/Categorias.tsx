import React, { useState, useEffect } from 'react';
import api from './services/api';
import { useNotification } from './contexts/NotificationContext';
import { useConfirm } from './contexts/ConfirmContext';
import { categoriaSchema, categoriaUpdateSchema } from './schemas/categoria.schema';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Tags, Plus, Pencil, Trash2, Sparkles, X } from 'lucide-react';

interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  created_at: string;
}

const Categorias: React.FC = () => {
  const { showNotification } = useNotification();
  const confirm = useConfirm();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cargarCategorias = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const validateForm = (): boolean => {
    const schema = editingCategoria ? categoriaUpdateSchema : categoriaSchema;
    const data = editingCategoria
      ? { nombre: formData.nombre, descripcion: formData.descripcion }
      : formData;
    const result = schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (editingCategoria) {
        await api.put(`/categorias/${editingCategoria.id}`, formData);
      } else {
        await api.post('/categorias', formData);
      }
      setShowModal(false);
      resetForm();
      cargarCategorias();
      showNotification(
        editingCategoria ? 'Categoría actualizada!' : 'Categoría creada con éxito! ✨',
        'success',
      );
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg = err.response?.data?.message || 'Hubo un error al guardar la categoría.';
      showNotification(errorMsg, 'error');
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Categoría',
      message:
        '¿Estás seguro de eliminar esta categoría? Esto podría afectar a los productos asociados.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/categorias/${id}`);
      cargarCategorias();
      showNotification('Categoría eliminada', 'info');
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      showNotification('No se pudo eliminar la categoría.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
    });
    setEditingCategoria(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Cargando categorías...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col gap-4 rounded-xl bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl">
            <Tags className="size-7 sm:size-8 text-brand-violet" />
            Gestión de Categorías
          </h1>
          <p className="text-muted-foreground">Organiza tus productos por tipo</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
            setErrors({});
          }}
        >
          <Plus className="size-4" />
          Nueva Categoría
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {categorias.map((categoria) => (
          <Card key={categoria.id} className="transition-shadow duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-brand-violet">
                <Sparkles className="size-4 text-brand-violet/60" />
                {categoria.nombre}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {categoria.descripcion || (
                  <span className="italic">Sin descripción</span>
                )}
              </p>
              <div className="flex justify-end gap-1 border-t pt-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleEdit(categoria)}
                  title="Editar"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(categoria.id)}
                  title="Eliminar"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowModal(false);
            setErrors({});
          }
        }}
      >
        <DialogContent className="sm:max-w-[550px]">
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre de la Categoría *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData({ ...formData, nombre: e.target.value });
                    if (errors.nombre) setErrors({ ...errors, nombre: '' });
                  }}
                  className={errors.nombre ? 'border-destructive' : ''}
                  required
                  placeholder="Ej: Tortas, Panes, Cookies..."
                />
                {errors.nombre && (
                  <p className="text-xs text-destructive">{errors.nombre}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => {
                    setFormData({ ...formData, descripcion: e.target.value });
                    if (errors.descripcion) setErrors({ ...errors, descripcion: '' });
                  }}
                  rows={3}
                  placeholder="Breve descripción de la categoría..."
                  className="h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                />
                {errors.descripcion && (
                  <p className="text-xs text-destructive">{errors.descripcion}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setErrors({});
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingCategoria ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categorias;
