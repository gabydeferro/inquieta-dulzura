import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from './services/api';
import { Ingrediente } from './types/Ingrediente';
import { RecetaDTO, CreateRecetaDTO, UpdateRecetaDTO } from './types/Receta';
import { useNotification } from './contexts/NotificationContext';
import { useConfirm } from './contexts/ConfirmContext';
import { useReducedMotion } from './lib/animations';
import { recetaSchema } from './schemas/receta.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  BookOpen,
  Plus,
  Clock,
  Cake,
  Eye,
  Printer,
  Trash2,
  ChefHat,
  CookingPot,
  X,
  Pencil,
  Package,
} from 'lucide-react';

interface FormIngrediente {
  ingrediente_id: number;
  nombre: string;
  cantidad: number;
  unidad_medida: string;
}

const Recetas: React.FC = () => {
  const confirm = useConfirm();
  const { showNotification } = useNotification();
  const { fadeUp, fadeIn, fadeInFromLeft, staggerContainer } = useReducedMotion();
  const [recetas, setRecetas] = useState<RecetaDTO[]>([]);
  const [selectedReceta, setSelectedReceta] = useState<RecetaDTO | null>(null);
  const [editingReceta, setEditingReceta] = useState<RecetaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState<Ingrediente[]>([]);
  const [formData, setFormData] = useState<{
    nombre: string;
    descripcion: string;
    instrucciones: string;
    tiempo_preparacion: number;
    porciones: number;
    ingredientes: FormIngrediente[];
  }>({
    nombre: '',
    descripcion: '',
    instrucciones: '',
    tiempo_preparacion: 0,
    porciones: 0,
    ingredientes: [],
  });
  const [selectedIngredienteId, setSelectedIngredienteId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number>(0);

  const cargarIngredientes = async () => {
    try {
      const response = await api.getIngredientes();
      setIngredientesDisponibles(response.data);
    } catch {
      showNotification('Error al cargar ingredientes', 'error');
    }
  };

  useEffect(() => {
    if (showModal) {
      void cargarIngredientes();
    }
  }, [showModal]);

  const cargarRecetas = async () => {
    setLoading(true);
    try {
      const response = await api.getRecetas();
      setRecetas(response.data);
    } catch {
      showNotification('Error al cargar recetas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarRecetas();
  }, []);

  const validateForm = (): boolean => {
    const result = recetaSchema.safeParse({
      ...formData,
      tiempo_preparacion: formData.tiempo_preparacion || 0,
      porciones: formData.porciones || 0,
    });
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

  const handleViewDetail = (receta: RecetaDTO) => {
    setSelectedReceta(receta);
    setShowDetailModal(true);
  };

  const handlePrint = (receta: RecetaDTO) => {
    console.log('Imprimir receta:', receta.nombre);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      instrucciones: '',
      tiempo_preparacion: 0,
      porciones: 0,
      ingredientes: [],
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReceta(null);
    setErrors({});
    resetForm();
  };

  const handleEdit = (receta: RecetaDTO) => {
    setEditingReceta(receta);
    setFormData({
      nombre: receta.nombre,
      descripcion: receta.descripcion || '',
      instrucciones: receta.instrucciones || '',
      tiempo_preparacion: receta.tiempo_preparacion || 0,
      porciones: receta.porciones || 0,
      ingredientes: (receta.ingredientes || []).map((ing) => ({
        ingrediente_id: ing.ingrediente_id,
        nombre: ing.ingrediente?.nombre || `ID: ${ing.ingrediente_id}`,
        cantidad: ing.cantidad,
        unidad_medida: ing.unidad_medida,
      })),
    });
    setShowModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'tiempo_preparacion' || name === 'porciones' ? parseInt(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleAgregarIngrediente = () => {
    if (!selectedIngredienteId || cantidad <= 0) return;

    const ingrediente = ingredientesDisponibles.find((i) => i.id === selectedIngredienteId);
    if (!ingrediente) return;

    const nuevoIngrediente: FormIngrediente = {
      ingrediente_id: ingrediente.id as number,
      nombre: ingrediente.nombre,
      cantidad: cantidad,
      unidad_medida: ingrediente.unidad_medida,
    };

    setFormData((prev) => ({
      ...prev,
      ingredientes: [...prev.ingredientes, nuevoIngrediente],
    }));

    setSelectedIngredienteId('');
    setCantidad(0);
  };

  const handleEliminarIngrediente = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredientes: prev.ingredientes.filter((_, i) => i !== index),
    }));
  };

  const handleGuardarReceta = async () => {
    if (!validateForm()) return;

    const apiIngredientes = formData.ingredientes.map((i) => ({
      ingrediente_id: i.ingrediente_id,
      cantidad: i.cantidad,
      unidad_medida: i.unidad_medida as 'kg' | 'litros' | 'unidades' | 'gramos' | 'ml',
    }));

    try {
      if (editingReceta) {
        const payload: UpdateRecetaDTO = {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          instrucciones: formData.instrucciones,
          tiempo_preparacion: formData.tiempo_preparacion,
          porciones: formData.porciones,
          ingredientes: apiIngredientes.length > 0 ? apiIngredientes : undefined,
        };
        await api.updateReceta(editingReceta.id, payload);
        showNotification('Receta actualizada con éxito', 'success');
      } else {
        const payload: CreateRecetaDTO = {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          instrucciones: formData.instrucciones,
          tiempo_preparacion: formData.tiempo_preparacion,
          porciones: formData.porciones,
          ingredientes: apiIngredientes.length > 0 ? apiIngredientes : undefined,
        };
        await api.createReceta(payload);
        showNotification('Receta creada con éxito', 'success');
      }
      handleCloseModal();
      void cargarRecetas();
    } catch {
      showNotification('Error al guardar receta', 'error');
    }
  };

  const handleEliminarReceta = async (id: number) => {
    const confirmed = await confirm({ message: '¿Estás seguro de eliminar esta receta?' });
    if (!confirmed) return;

    try {
      await api.deleteReceta(id);
      showNotification('Receta eliminada con éxito', 'success');
      void cargarRecetas();
    } catch {
      showNotification('Error al eliminar receta', 'error');
    }
  };

  const getIngredientName = (ing: NonNullable<RecetaDTO['ingredientes']>[number]): string => {
    return ing.ingrediente?.nombre || `ID: ${ing.ingrediente_id}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Cargando recetas...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <motion.header
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
            <BookOpen className="size-7 sm:size-8 lg:size-9 text-brand-violet" />
            Recetas
          </h1>
          <p className="text-muted-foreground">Recetas de productos de la pastelería</p>
        </div>
        <Button
          onClick={() => {
            setEditingReceta(null);
            resetForm();
            setErrors({});
            setShowModal(true);
          }}
        >
          <Plus className="size-4" />
          Nueva Receta
        </Button>
      </motion.header>

      {recetas.length === 0 ? (
        <motion.div
          className="flex min-h-[30vh] flex-col items-center justify-center gap-4 text-muted-foreground"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <BookOpen className="size-12 opacity-40" />
          <p className="text-lg">No hay recetas disponibles</p>
          <Button
            onClick={() => {
              setEditingReceta(null);
              resetForm();
              setErrors({});
              setShowModal(true);
            }}
          >
            <Plus className="size-4" />
            Crear primera receta
          </Button>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {recetas.map((receta) => (
            <motion.div key={receta.id} variants={fadeUp} layout>
              <Card
                className="border-t-[10px] border-t-brand-accent transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
              <CardHeader className="pb-2">
                <CardTitle className="text-base uppercase sm:text-lg">{receta.nombre}</CardTitle>
                <div className="mt-1 flex flex-wrap gap-2">
                  {receta.tiempo_preparacion && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="size-3" />
                      {receta.tiempo_preparacion} min
                    </Badge>
                  )}
                  {receta.porciones && (
                    <Badge variant="secondary" className="gap-1">
                      <Cake className="size-3" />
                      {receta.porciones} porciones
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">{receta.descripcion}</p>

                <div className="mb-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    <ChefHat className="mr-1 inline size-3" />
                    Ingredientes ({receta.ingredientes?.length || 0})
                  </h4>
                  <ul className="space-y-1">
                    {receta.ingredientes?.slice(0, 3).map((ing) => (
                      <li
                        key={ing.ingrediente_id}
                        className="text-xs text-amber-900 dark:text-amber-200"
                      >
                        {getIngredientName(ing)} — {ing.cantidad} {ing.unidad_medida}
                      </li>
                    ))}
                    {(receta.ingredientes?.length || 0) > 3 && (
                      <li className="text-xs italic text-amber-700 dark:text-amber-400">
                        + {(receta.ingredientes?.length || 0) - 3} más...
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDetail(receta)}
                  >
                    <Eye className="size-3.5" />
                    Ver Detalle
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEdit(receta)}
                    title="Editar"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handlePrint(receta)}
                    title="Imprimir"
                  >
                    <Printer className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEliminarReceta(receta.id)}
                    title="Eliminar"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
            </CardContent>
          </Card>
          </motion.div>
          ))}
        </motion.div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="size-5 text-brand-violet" />
              {selectedReceta?.nombre}
            </DialogTitle>
          </DialogHeader>

          {selectedReceta && (
            <motion.div
              className="max-h-[65vh] overflow-y-auto space-y-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Description */}
              <motion.div variants={fadeUp}>
                <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-foreground">
                  <BookOpen className="size-4" />
                  Descripción
                </h3>
                <p className="text-sm text-muted-foreground">{selectedReceta.descripcion}</p>
              </motion.div>

              {/* Meta cards */}
              <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2" variants={fadeUp}>
                <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                  <Clock className="size-8 text-muted-foreground" />
                  <div>
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                      Tiempo
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {selectedReceta.tiempo_preparacion} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                  <Cake className="size-8 text-muted-foreground" />
                  <div>
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                      Porciones
                    </p>
                    <p className="text-lg font-bold text-foreground">{selectedReceta.porciones}</p>
                  </div>
                </div>
              </motion.div>

              {/* Ingredients */}
              <motion.div variants={fadeUp}>
                <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-foreground">
                  <CookingPot className="size-4" />
                  Ingredientes
                </h3>
                <div className="space-y-1 rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
                  {selectedReceta.ingredientes?.map((ing) => (
                    <div
                      key={ing.ingrediente_id}
                      className="flex items-center justify-between border-b border-amber-200/50 py-2 last:border-0 dark:border-amber-800/30"
                    >
                      <span className="font-medium text-amber-900 dark:text-amber-200">
                        {getIngredientName(ing)}
                      </span>
                      <span className="font-semibold text-amber-800 dark:text-amber-300">
                        {ing.cantidad} {ing.unidad_medida}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Instructions */}
              <motion.div variants={fadeInFromLeft}>
                <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-foreground">
                  <ChefHat className="size-4" />
                  Instrucciones
                </h3>
                <div className="space-y-2 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/30">
                  {selectedReceta.instrucciones?.split('\n').map((paso, index) => (
                    <div
                      key={index}
                      className="flex gap-3 border-b border-emerald-200/50 py-3 last:border-0 dark:border-emerald-800/30"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="flex-1 pt-1 text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">
                        {paso}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Productos que usan esta receta */}
              <motion.div variants={fadeUp}>
                <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-foreground">
                  <Package className="size-4" />
                  Productos que usan esta receta
                </h3>
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
                  {selectedReceta.productos && selectedReceta.productos.length > 0 ? (
                    <div className="space-y-1">
                      {selectedReceta.productos.map((prod) => (
                        <div
                          key={prod.producto_id}
                          className="flex items-center justify-between border-b border-blue-200/50 py-2 last:border-0 dark:border-blue-800/30"
                        >
                          <span className="font-medium text-blue-900 dark:text-blue-200">
                            {prod.nombre}
                          </span>
                          <span className="font-semibold text-blue-800 dark:text-blue-300">
                            Cant: {prod.cantidad_receta}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No hay productos vinculados a esta receta
                    </p>
                  )}
                </div>
              </motion.div>

              <DialogFooter className="!mt-6">
                <Button variant="secondary" onClick={() => handlePrint(selectedReceta)}>
                  <Printer className="size-4" />
                  Imprimir Receta
                </Button>
                <Button onClick={() => setShowDetailModal(false)}>Cerrar</Button>
              </DialogFooter>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
      >
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="size-5 text-brand-violet" />
              {editingReceta ? 'Editar Receta' : 'Nueva Receta'}
            </DialogTitle>
          </DialogHeader>

          <motion.div className="max-h-[65vh] overflow-y-auto space-y-4 py-4" variants={fadeIn}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleFormChange}
                  required
                  className={errors.nombre ? 'border-destructive' : ''}
                />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="tiempo_preparacion">Tiempo de Preparación (min)</Label>
                <Input
                  id="tiempo_preparacion"
                  type="number"
                  name="tiempo_preparacion"
                  value={formData.tiempo_preparacion || ''}
                  onChange={handleFormChange}
                  className={errors.tiempo_preparacion ? 'border-destructive' : ''}
                />
                {errors.tiempo_preparacion && (
                  <p className="text-xs text-destructive">{errors.tiempo_preparacion}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="porciones">Porciones</Label>
                <Input
                  id="porciones"
                  type="number"
                  name="porciones"
                  value={formData.porciones || ''}
                  onChange={handleFormChange}
                  className={errors.porciones ? 'border-destructive' : ''}
                />
                {errors.porciones && <p className="text-xs text-destructive">{errors.porciones}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleFormChange}
                rows={3}
                className={`h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 ${errors.descripcion ? 'border-destructive' : ''}`}
              />
              {errors.descripcion && (
                <p className="text-xs text-destructive">{errors.descripcion}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Ingredientes</Label>
              <div className="flex flex-wrap items-end gap-2">
                <select
                  value={selectedIngredienteId}
                  onChange={(e) =>
                    setSelectedIngredienteId(e.target.value ? parseInt(e.target.value) : '')
                  }
                  className="flex-1 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Seleccionar ingrediente...</option>
                  {ingredientesDisponibles.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.nombre} ({ing.unidad_medida})
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  placeholder="Cantidad"
                  value={cantidad || ''}
                  onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
                  className="w-28"
                />
                <Button type="button" variant="secondary" onClick={handleAgregarIngrediente}>
                  <Plus className="size-4" />
                  Agregar
                </Button>
              </div>

              <div className="mt-2 space-y-1 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                {formData.ingredientes.length === 0 && (
                  <p className="text-xs text-muted-foreground">No hay ingredientes agregados</p>
                )}
                {formData.ingredientes.map((ing, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-amber-200/50 py-1.5 last:border-0 dark:border-amber-800/30"
                  >
                    <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      {ing.nombre}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        {ing.cantidad} {ing.unidad_medida}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleEliminarIngrediente(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="instrucciones">Instrucciones</Label>
              <textarea
                id="instrucciones"
                name="instrucciones"
                value={formData.instrucciones}
                onChange={handleFormChange}
                rows={6}
                placeholder="Escribe las instrucciones paso a paso..."
                className="h-32 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
              />
            </div>
          </motion.div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarReceta}>
              <BookOpen className="size-4" />
              Guardar Receta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recetas;
