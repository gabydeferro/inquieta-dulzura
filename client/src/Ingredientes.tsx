import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from './services/api';
import { Ingrediente, UnidadMedidaIngrediente } from './types/Ingrediente';
import { useNotification } from './contexts/NotificationContext';
import { useConfirm } from './contexts/ConfirmContext';
import { useReducedMotion } from './lib/animations';
import { ingredienteSchema, ingredienteUpdateSchema } from './schemas/ingrediente.schema';
import {
  Table,
  TableHead,
  TableHeader,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FlaskConical, Plus, Pencil, Trash2 } from 'lucide-react';

const unidades: UnidadMedidaIngrediente[] = ['kg', 'litros', 'unidades', 'gramos', 'ml'];

const Ingredientes: React.FC = () => {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [editingIngrediente, setEditingIngrediente] = useState<Ingrediente | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showNotification } = useNotification();
  const confirm = useConfirm();
  const { fadeUp, staggerContainer } = useReducedMotion();

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

  const handleDelete = async (ingrediente: Ingrediente) => {
    const result = await confirm({
      title: 'Eliminar Ingrediente',
      message: `¿Estás seguro de eliminar "${ingrediente.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (result) {
      try {
        await api.deleteIngrediente(ingrediente.id!);
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

  const handleChange = (field: string, value: string | number) => {
    setEditingIngrediente((prev) => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.header
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
            <FlaskConical className="size-7 sm:size-8 lg:size-9 text-brand-violet" />
            Ingredientes
          </h1>
          <p className="text-muted-foreground">Gestión de ingredientes de la pastelería</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="size-4" /> Nuevo Ingrediente
        </Button>
      </motion.header>

      {/* Table */}
      {ingredientes.length === 0 ? (
        <motion.div
          className="flex min-h-[30vh] flex-col items-center justify-center gap-2 text-muted-foreground"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <FlaskConical className="size-12 opacity-30" />
          <p>No hay ingredientes cargados</p>
        </motion.div>
      ) : (
        <div className="rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Descripción</TableHead>
                <TableHead className="hidden md:table-cell">Unidad de Medida</TableHead>
                <TableHead>Costo Unitario</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
              {ingredientes.map((ingrediente) => (
                <motion.tr key={ingrediente.id} variants={fadeUp}>
                  <TableCell className="font-medium">{ingrediente.nombre}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {ingrediente.descripcion || <span className="italic opacity-50">—</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {ingrediente.unidad_medida}
                  </TableCell>
                  <TableCell>
                    {ingrediente.costo_unitario
                      ? `$${Number(ingrediente.costo_unitario).toFixed(2)}`
                      : '$0.00'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
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
                        onClick={() => void handleDelete(ingrediente)}
                        title="Eliminar"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </motion.tbody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false);
            setErrors({});
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={(e) => void handleCreateEdit(e)} noValidate>
            <DialogHeader>
              <DialogTitle>
                {editingIngrediente?.id ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
              </DialogTitle>
            </DialogHeader>

            <motion.div className="grid gap-4 py-4" variants={fadeUp}>
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={editingIngrediente?.nombre || ''}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  className={errors.nombre ? 'border-destructive' : ''}
                  placeholder="Nombre del ingrediente"
                  required
                />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  value={editingIngrediente?.descripcion || ''}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  rows={3}
                  className="h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                  placeholder="Descripción del ingrediente..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Unidad de Medida</Label>
                  <Select
                    value={editingIngrediente?.unidad_medida || 'unidades'}
                    onValueChange={(value) => handleChange('unidad_medida', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.unidad_medida && (
                    <p className="text-xs text-destructive">{errors.unidad_medida}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="costo_unitario">Costo Unitario</Label>
                  <Input
                    id="costo_unitario"
                    type="number"
                    value={editingIngrediente?.costo_unitario || 0}
                    onChange={(e) => handleChange('costo_unitario', parseFloat(e.target.value) || 0)}
                    step="0.01"
                    className={errors.costo_unitario ? 'border-destructive' : ''}
                  />
                  {errors.costo_unitario && (
                    <p className="text-xs text-destructive">{errors.costo_unitario}</p>
                  )}
                </div>
              </div>
            </motion.div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingIngrediente?.id ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ingredientes;
