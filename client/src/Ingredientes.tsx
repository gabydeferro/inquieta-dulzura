import React, { useState, useEffect } from 'react';
import api from './services/api';
import { Ingrediente, UnidadMedidaIngrediente } from './types/Ingrediente';
import { useNotification } from './contexts/NotificationContext';
import { useConfirm } from './contexts/ConfirmContext';
import { ingredienteSchema, ingredienteUpdateSchema } from './schemas/ingrediente.schema';
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
import { Wheat, Scale, Plus, Pencil, Trash2 } from 'lucide-react';

const unidades: UnidadMedidaIngrediente[] = ['kg', 'litros', 'unidades', 'gramos', 'ml'];

const Ingredientes: React.FC = () => {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [editingIngrediente, setEditingIngrediente] = useState<Ingrediente | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showNotification } = useNotification();
  const confirm = useConfirm();

  const fetchIngredientes = async () => {
    try {
      const response = await api.getIngredientes();
      setIngredientes(response.data);
    } catch {
      showNotification('Error al cargar ingredientes', 'error');
    }
  };

  useEffect(() => {
    void fetchIngredientes();
  }, []);

  const validateForm = (): boolean => {
    if (!editingIngrediente) return false;
    const schema = editingIngrediente.id ? ingredienteUpdateSchema : ingredienteSchema;
    const result = schema.safeParse(editingIngrediente);
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

  const handleCreateEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngrediente) return;

    if (!validateForm()) return;

    try {
      if (editingIngrediente.id) {
        await api.updateIngrediente(editingIngrediente.id, editingIngrediente);
        showNotification('Ingrediente actualizado con éxito', 'success');
      } else {
        await api.createIngrediente(editingIngrediente);
        showNotification('Ingrediente creado con éxito', 'success');
      }
      setIsModalOpen(false);
      setEditingIngrediente(null);
      fetchIngredientes();
    } catch {
      showNotification('Error al guardar ingrediente', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await confirm({
      message: '¿Estás seguro de que quieres eliminar este ingrediente?',
    });
    if (result) {
      try {
        await api.deleteIngrediente(id);
        showNotification('Ingrediente eliminado con éxito', 'success');
        fetchIngredientes();
      } catch {
        showNotification('Error al eliminar ingrediente', 'error');
      }
    }
  };

  const openCreateModal = () => {
    setErrors({});
    setEditingIngrediente({
      nombre: '',
      descripcion: '',
      unidad_medida: 'unidades',
      costo_unitario: 0,
      activo: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ingrediente: Ingrediente) => {
    setErrors({});
    setEditingIngrediente({ ...ingrediente });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setErrors({});
    setIsModalOpen(false);
    setEditingIngrediente(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setEditingIngrediente((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value,
      };
    });
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl">
          <Wheat className="size-7 sm:size-8 text-brand-violet" />
          Gestión de Ingredientes
        </h2>
        <Button onClick={openCreateModal}>
          <Plus className="size-4" />
          Agregar Ingrediente
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {ingredientes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No hay ingredientes cargados
          </div>
        ) : (
          ingredientes.map((ingrediente) => (
            <Card key={ingrediente.id} className="transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Scale className="size-4 text-brand-violet/60" />
                  {ingrediente.nombre}
                </CardTitle>
              </CardHeader>

              <CardContent>
                {ingrediente.descripcion && (
                  <p className="mb-3 text-sm text-muted-foreground">{ingrediente.descripcion}</p>
                )}

                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {ingrediente.unidad_medida}
                  </Badge>
                  <Badge variant="outline">
                    ${Number(ingrediente.costo_unitario || 0).toFixed(2)}
                  </Badge>
                </div>

                <div className="flex justify-end gap-1 border-t pt-3">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditModal(ingrediente)}
                    title="Editar"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(ingrediente.id!)}
                    title="Eliminar"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-[550px]">
          <form onSubmit={handleCreateEdit} noValidate>
            <DialogHeader>
              <DialogTitle>
                {editingIngrediente?.id ? 'Editar Ingrediente' : 'Crear Ingrediente'}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre:</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={editingIngrediente?.nombre || ''}
                  onChange={handleChange}
                  required
                  className={errors.nombre ? 'border-destructive' : ''}
                />
                {errors.nombre && (
                  <p className="text-xs text-destructive">{errors.nombre}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción:</Label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={editingIngrediente?.descripcion || ''}
                  onChange={handleChange}
                  rows={3}
                  className="h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="unidad_medida">Unidad de Medida:</Label>
                  <select
                    id="unidad_medida"
                    name="unidad_medida"
                    value={editingIngrediente?.unidad_medida || 'unidades'}
                    onChange={handleChange}
                    className={`flex h-10 w-full rounded-lg border bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 ${errors.unidad_medida ? 'border-destructive' : 'border-input'}`}
                  >
                    {unidades.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  {errors.unidad_medida && (
                    <p className="text-xs text-destructive">{errors.unidad_medida}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="costo_unitario">Costo Unitario:</Label>
                  <Input
                    id="costo_unitario"
                    name="costo_unitario"
                    type="number"
                    step="0.01"
                    value={editingIngrediente?.costo_unitario || 0}
                    onChange={handleChange}
                    className={errors.costo_unitario ? 'border-destructive' : ''}
                  />
                  {errors.costo_unitario && (
                    <p className="text-xs text-destructive">{errors.costo_unitario}</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ingredientes;
