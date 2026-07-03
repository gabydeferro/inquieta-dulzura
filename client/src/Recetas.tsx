import React, { useState, useEffect } from 'react';
import api from './services/api';
import { useConfirm } from './contexts/ConfirmContext';
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
} from 'lucide-react';

const RECETAS_STORAGE_KEY = 'inquieta-recetas';

interface IngredienteDB {
  id: number;
  nombre: string;
  unidad_medida: string;
  costo_unitario: number;
  activo: boolean;
}

interface Ingrediente {
  id: number;
  nombre: string;
  cantidad: number;
  unidad_medida: string;
}

interface Receta {
  id: number;
  nombre: string;
  descripcion?: string;
  instrucciones?: string;
  tiempo_preparacion?: number;
  porciones?: number;
  activo: boolean;
  ingredientes?: Ingrediente[];
}

const Recetas: React.FC = () => {
  const confirm = useConfirm();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [editingReceta, setEditingReceta] = useState<Receta | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form state
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState<IngredienteDB[]>([]);
  const [formData, setFormData] = useState<Partial<Receta>>({
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
      const response = await api.get<IngredienteDB[]>('/ingredientes');
      setIngredientesDisponibles(response.data);
    } catch (error) {
      console.error('Error al cargar ingredientes:', error);
    }
  };

  useEffect(() => {
    if (showModal) {
      void cargarIngredientes();
    }
  }, [showModal]);

  const cargarRecetas = async () => {
    try {
      const stored = localStorage.getItem(RECETAS_STORAGE_KEY);
      if (stored) {
        setRecetas(JSON.parse(stored));
      } else {
        setRecetas([
          {
            id: 1,
            nombre: 'Torta de Chocolate',
            descripcion: 'Deliciosa torta de chocolate con cobertura',
            instrucciones:
              '1. Precalentar el horno a 180°C\n2. Mezclar ingredientes secos\n3. Agregar ingredientes húmedos\n4. Hornear por 35 minutos',
            tiempo_preparacion: 60,
            porciones: 8,
            activo: true,
            ingredientes: [
              { id: 1, nombre: 'Harina', cantidad: 300, unidad_medida: 'gramos' },
              { id: 2, nombre: 'Azúcar', cantidad: 200, unidad_medida: 'gramos' },
              { id: 3, nombre: 'Chocolate', cantidad: 150, unidad_medida: 'gramos' },
              { id: 4, nombre: 'Huevos', cantidad: 3, unidad_medida: 'unidades' },
              { id: 5, nombre: 'Mantequilla', cantidad: 100, unidad_medida: 'gramos' },
            ],
          },
          {
            id: 2,
            nombre: 'Pan Integral',
            descripcion: 'Pan artesanal integral',
            instrucciones:
              '1. Mezclar harina con levadura\n2. Agregar agua tibia\n3. Amasar por 10 minutos\n4. Dejar reposar 1 hora\n5. Hornear a 200°C por 30 minutos',
            tiempo_preparacion: 120,
            porciones: 12,
            activo: true,
            ingredientes: [
              { id: 6, nombre: 'Harina Integral', cantidad: 500, unidad_medida: 'gramos' },
              { id: 7, nombre: 'Levadura', cantidad: 10, unidad_medida: 'gramos' },
              { id: 8, nombre: 'Agua', cantidad: 300, unidad_medida: 'ml' },
              { id: 9, nombre: 'Sal', cantidad: 10, unidad_medida: 'gramos' },
            ],
          },
        ]);
      }
    } catch (error) {
      console.error('Error al cargar recetas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarRecetas();
  }, []);

  // Persist recetas to localStorage on every change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(RECETAS_STORAGE_KEY, JSON.stringify(recetas));
    }
  }, [recetas, loading]);

  const handleViewDetail = (receta: Receta) => {
    setSelectedReceta(receta);
    setShowDetailModal(true);
  };

  const handlePrint = (receta: Receta) => {
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
    resetForm();
  };

  const handleEdit = (receta: Receta) => {
    setEditingReceta(receta);
    setFormData({
      nombre: receta.nombre,
      descripcion: receta.descripcion || '',
      instrucciones: receta.instrucciones || '',
      tiempo_preparacion: receta.tiempo_preparacion || 0,
      porciones: receta.porciones || 0,
      ingredientes: receta.ingredientes || [],
    });
    setShowModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'tiempo_preparacion' || name === 'porciones' ? parseInt(value) || 0 : value,
    }));
  };

  const handleAgregarIngrediente = () => {
    if (!selectedIngredienteId || cantidad <= 0) return;

    const ingrediente = ingredientesDisponibles.find((i) => i.id === selectedIngredienteId);
    if (!ingrediente) return;

    const nuevoIngrediente: Ingrediente = {
      id: ingrediente.id,
      nombre: ingrediente.nombre,
      cantidad: cantidad,
      unidad_medida: ingrediente.unidad_medida,
    };

    setFormData((prev) => ({
      ...prev,
      ingredientes: [...(prev.ingredientes || []), nuevoIngrediente],
    }));

    setSelectedIngredienteId('');
    setCantidad(0);
  };

  const handleEliminarIngrediente = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredientes: prev.ingredientes?.filter((_, i) => i !== index),
    }));
  };

  const handleGuardarReceta = () => {
    if (!formData.nombre) {
      alert('El nombre de la receta es requerido');
      return;
    }

    if (editingReceta) {
      // Update existing recipe in-place
      setRecetas(
        recetas.map((r) =>
          r.id === editingReceta.id
            ? { ...r, ...formData, id: r.id, activo: r.activo }
            : r,
        ),
      );
    } else {
      // Create new recipe
      const nuevaReceta: Receta = {
        id: Date.now(),
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        instrucciones: formData.instrucciones,
        tiempo_preparacion: formData.tiempo_preparacion,
        porciones: formData.porciones,
        activo: true,
        ingredientes: formData.ingredientes,
      };
      setRecetas([...recetas, nuevaReceta]);
    }

    handleCloseModal();
  };

  const handleEliminarReceta = async (id: number) => {
    const confirmed = await confirm({ message: '¿Estás seguro de eliminar esta receta?' });
    if (!confirmed) return;

    setRecetas(recetas.filter((r) => r.id !== id));
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
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
            <BookOpen className="size-7 sm:size-8 lg:size-9 text-brand-violet" />
            Recetas
          </h1>
          <p className="text-muted-foreground">Recetas de productos de la pastelería</p>
        </div>
        <Button onClick={() => { setEditingReceta(null); resetForm(); setShowModal(true); }}>
          <Plus className="size-4" />
          Nueva Receta
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {recetas.map((receta) => (
          <Card
            key={receta.id}
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
                    <li key={ing.id} className="text-xs text-amber-900 dark:text-amber-200">
                      {ing.nombre} — {ing.cantidad} {ing.unidad_medida}
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
        ))}
      </div>

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
            <div className="max-h-[65vh] overflow-y-auto space-y-6">
              {/* Description */}
              <div>
                <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-foreground">
                  <BookOpen className="size-4" />
                  Descripción
                </h3>
                <p className="text-sm text-muted-foreground">{selectedReceta.descripcion}</p>
              </div>

              {/* Meta cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <p className="text-lg font-bold text-foreground">
                      {selectedReceta.porciones}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-foreground">
                  <CookingPot className="size-4" />
                  Ingredientes
                </h3>
                <div className="space-y-1 rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
                  {selectedReceta.ingredientes?.map((ing) => (
                    <div
                      key={ing.id}
                      className="flex items-center justify-between border-b border-amber-200/50 py-2 last:border-0 dark:border-amber-800/30"
                    >
                      <span className="font-medium text-amber-900 dark:text-amber-200">
                        {ing.nombre}
                      </span>
                      <span className="font-semibold text-amber-800 dark:text-amber-300">
                        {ing.cantidad} {ing.unidad_medida}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-foreground">
                  <ChefHat className="size-4" />
                  Instrucciones
                </h3>
                <div className="space-y-2 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/30">
                  {selectedReceta.instrucciones?.split('\n').map((paso, index) => (
                    <div key={index} className="flex gap-3 border-b border-emerald-200/50 py-3 last:border-0 dark:border-emerald-800/30">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="flex-1 pt-1 text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">
                        {paso}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="!mt-6">
                <Button
                  variant="secondary"
                  onClick={() => handlePrint(selectedReceta)}
                >
                  <Printer className="size-4" />
                  Imprimir Receta
                </Button>
                <Button onClick={() => setShowDetailModal(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="size-5 text-brand-violet" />
              {editingReceta ? 'Editar Receta' : 'Nueva Receta'}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre || ''}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="tiempo_preparacion">Tiempo de Preparación (min)</Label>
                <Input
                  id="tiempo_preparacion"
                  type="number"
                  name="tiempo_preparacion"
                  value={formData.tiempo_preparacion || 0}
                  onChange={handleFormChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="porciones">Porciones</Label>
                <Input
                  id="porciones"
                  type="number"
                  name="porciones"
                  value={formData.porciones || 0}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion || ''}
                onChange={handleFormChange}
                rows={3}
                className="h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
              />
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAgregarIngrediente}
                >
                  <Plus className="size-4" />
                  Agregar
                </Button>
              </div>

              <div className="mt-2 space-y-1 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                {formData.ingredientes?.length === 0 && (
                  <p className="text-xs text-muted-foreground">No hay ingredientes agregados</p>
                )}
                {formData.ingredientes?.map((ing, index) => (
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
                value={formData.instrucciones || ''}
                onChange={handleFormChange}
                rows={6}
                placeholder="Escribe las instrucciones paso a paso..."
                className="h-32 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
            >
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
