import React, { useState, useEffect } from 'react';
import api from './services/api';
import { useNotification } from './contexts/NotificationContext';
import { useConfirm } from './contexts/ConfirmContext';
import { inventarioCreateSchema, inventarioUpdateSchema } from './schemas/inventario.schema';
import { ProductoReceta } from './types/Producto';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Plus, Pencil, Trash2, AlertTriangle, Link, X } from 'lucide-react';

interface Producto {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number;
  sku?: string;
  activo: boolean;
  created_at: string;
}

interface Stock {
  id: number;
  producto_id: number;
  cantidad_disponible: number;
  cantidad_minima: number;
  unidad_medida: string;
}

interface ProductoConStock extends Producto {
  stock?: Stock;
}

const Inventario: React.FC = () => {
  const { showNotification } = useNotification();
  const confirm = useConfirm();
  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoConStock | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    costo: '',
    sku: '',
    categoria_id: '',
    cantidad_disponible: '',
    cantidad_minima: '',
    unidad_medida: 'unidades',
  });

  // Vinculación state
  const [recetasVinculadas, setRecetasVinculadas] = useState<ProductoReceta[]>([]);
  const [todasLasRecetas, setTodasLasRecetas] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedRecetaId, setSelectedRecetaId] = useState<number | ''>('');
  const [cantidadReceta, setCantidadReceta] = useState<number>(1);

  const cargarCategorias = async () => {
    try {
      const response = await api.get<{ id: number; nombre: string }[]>('/categorias');
      setCategorias(response.data);
      if (response.data.length > 0 && !formData.categoria_id) {
        setFormData((prev) => ({ ...prev, categoria_id: response.data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await api.get<ProductoConStock[]>('/productos');
      setProductos(response.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      // Fallback a datos mock si falla o no hay datos
      if (productos.length === 0) {
        setProductos([
          {
            id: 1,
            categoria_id: 1,
            nombre: 'Ejemplo de Producto',
            descripcion: 'Carga tus propios productos',
            precio: 0,
            costo: 0,
            sku: '001',
            activo: true,
            created_at: new Date().toISOString(),
            stock: {
              id: 1,
              producto_id: 1,
              cantidad_disponible: 0,
              cantidad_minima: 0,
              unidad_medida: 'unidades',
            },
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([cargarProductos(), cargarCategorias()]);
  }, []);

  const validateForm = (): boolean => {
    const schema = editingProduct ? inventarioUpdateSchema : inventarioCreateSchema;
    const result = schema.safeParse(formData);
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
      if (editingProduct) {
        await api.put(`/productos/${editingProduct.id}`, formData);
        showNotification('Producto actualizado con éxito!', 'success');
      } else {
        await api.post('/productos', formData);
        showNotification('Producto creado correctamente! 🍰', 'success');
      }
      setShowModal(false);
      resetForm();
      cargarProductos();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg = err.response?.data?.message || 'Error al guardar el producto.';
      showNotification(errorMsg, 'error');
    }
  };

  const handleEdit = async (producto: ProductoConStock) => {
    setErrors({});
    setEditingProduct(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio.toString(),
      costo: producto.costo?.toString() || '',
      sku: producto.sku || '',
      categoria_id: producto.categoria_id.toString(),
      cantidad_disponible: producto.stock?.cantidad_disponible.toString() || '',
      cantidad_minima: producto.stock?.cantidad_minima.toString() || '',
      unidad_medida: producto.stock?.unidad_medida || 'unidades',
    });
    setShowModal(true);

    // Load vinculación data and available recetas
    try {
      const [recetasResp, todasResp] = await Promise.all([
        api.getRecetasByProducto(producto.id),
        api.getRecetas(),
      ]);
      setRecetasVinculadas(recetasResp.data);
      setTodasLasRecetas(todasResp.data);
    } catch {
      setRecetasVinculadas([]);
      setTodasLasRecetas([]);
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Producto',
      message: '¿Estás seguro de eliminar este producto?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/productos/${id}`);
      showNotification('Producto eliminado', 'info');
      cargarProductos();
    } catch (error: unknown) {
      console.error('Error al eliminar producto:', error);
      showNotification('Error al eliminar el producto', 'error');
    }
  };

  const handleVincularReceta = async () => {
    if (!editingProduct || !selectedRecetaId) return;
    try {
      await api.vincularProductoReceta(editingProduct.id, {
        receta_id: selectedRecetaId as number,
        cantidad_receta: cantidadReceta,
      });
      const resp = await api.getRecetasByProducto(editingProduct.id);
      setRecetasVinculadas(resp.data);
      setSelectedRecetaId('');
      setCantidadReceta(1);
      showNotification('Receta vinculada con éxito', 'success');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg = err.response?.data?.message || 'Error al vincular receta';
      showNotification(errorMsg, 'error');
    }
  };

  const handleDesvincularReceta = async (recetaId: number) => {
    if (!editingProduct) return;
    const isConfirmed = await confirm({
      title: 'Desvincular Receta',
      message: '¿Estás seguro de desvincular esta receta del producto?',
      confirmText: 'Desvincular',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.desvincularProductoReceta(editingProduct.id, recetaId);
      setRecetasVinculadas((prev) => prev.filter((r) => r.receta_id !== recetaId));
      showNotification('Receta desvinculada', 'info');
    } catch {
      showNotification('Error al desvincular receta', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      costo: '',
      sku: '',
      categoria_id: '1',
      cantidad_disponible: '',
      cantidad_minima: '',
      unidad_medida: 'unidades',
    });
    setEditingProduct(null);
    setRecetasVinculadas([]);
    setTodasLasRecetas([]);
    setSelectedRecetaId('');
    setCantidadReceta(1);
  };

  const getStockStatus = (producto: ProductoConStock) => {
    if (!producto.stock) return 'sin-stock';
    if (producto.stock.cantidad_disponible <= producto.stock.cantidad_minima) return 'stock-bajo';
    return 'stock-ok';
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Cargando inventario...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
            <Package className="size-7 sm:size-8 lg:size-9 text-brand-violet" />
            Inventario de Productos
          </h1>
          <p className="text-muted-foreground">Gestión de productos y stock</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
            setErrors({});
          }}
        >
          <Plus className="size-4" />+ Nuevo Producto
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {productos.map((producto) => (
          <Card
            key={producto.id}
            className={`transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg ${
              getStockStatus(producto) === 'stock-bajo'
                ? 'border-l-4 border-l-amber-500'
                : getStockStatus(producto) === 'sin-stock'
                  ? 'border-l-4 border-l-destructive'
                  : ''
            }`}
          >
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-base sm:text-lg">{producto.nombre}</CardTitle>
              {producto.sku && (
                <Badge variant="outline" className="shrink-0 font-mono text-[0.7rem]">
                  {producto.sku}
                </Badge>
              )}
            </CardHeader>

            <CardContent>
              {producto.descripcion && (
                <p className="mb-3 text-sm text-muted-foreground">{producto.descripcion}</p>
              )}

              <div className="mb-3 flex gap-4 rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                    Precio
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    ${Number(producto.precio).toFixed(2)}
                  </p>
                </div>
                {producto.costo && (
                  <div>
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                      Costo
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      ${Number(producto.costo).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {producto.stock && (
                <div className="mb-3">
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 p-2">
                    <span className="font-semibold text-foreground">
                      {producto.stock.cantidad_disponible} {producto.stock.unidad_medida}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Mín: {producto.stock.cantidad_minima}
                    </span>
                  </div>
                  {producto.stock.cantidad_disponible <= producto.stock.cantidad_minima && (
                    <Badge variant="destructive" className="mt-2 w-full justify-center gap-1">
                      <AlertTriangle className="size-3" />
                      Stock bajo
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-1 border-t pt-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleEdit(producto)}
                  title="Editar"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(producto.id)}
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
              <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => {
                      setFormData({ ...formData, nombre: e.target.value });
                      if (errors.nombre) setErrors({ ...errors, nombre: '' });
                    }}
                    className={errors.nombre ? 'border-destructive' : ''}
                    required
                  />
                  {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="categoria_id">Categoría *</Label>
                <Select
                  value={formData.categoria_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, categoria_id: value });
                    if (errors.categoria_id) setErrors({ ...errors, categoria_id: '' });
                  }}
                >
                  <SelectTrigger className={errors.categoria_id ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoria_id && (
                  <p className="text-xs text-destructive">{errors.categoria_id}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  className="h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="precio">Precio *</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => {
                      setFormData({ ...formData, precio: e.target.value });
                      if (errors.precio) setErrors({ ...errors, precio: '' });
                    }}
                    className={errors.precio ? 'border-destructive' : ''}
                    required
                  />
                  {errors.precio && <p className="text-xs text-destructive">{errors.precio}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="costo">Costo</Label>
                  <Input
                    id="costo"
                    type="number"
                    step="0.01"
                    value={formData.costo}
                    onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="cantidad_disponible">Cantidad Disponible *</Label>
                  <Input
                    id="cantidad_disponible"
                    type="number"
                    value={formData.cantidad_disponible}
                    onChange={(e) => {
                      setFormData({ ...formData, cantidad_disponible: e.target.value });
                      if (errors.cantidad_disponible)
                        setErrors({ ...errors, cantidad_disponible: '' });
                    }}
                    className={errors.cantidad_disponible ? 'border-destructive' : ''}
                    required
                  />
                  {errors.cantidad_disponible && (
                    <p className="text-xs text-destructive">{errors.cantidad_disponible}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cantidad_minima">Cantidad Mínima *</Label>
                  <Input
                    id="cantidad_minima"
                    type="number"
                    value={formData.cantidad_minima}
                    onChange={(e) => {
                      setFormData({ ...formData, cantidad_minima: e.target.value });
                      if (errors.cantidad_minima) setErrors({ ...errors, cantidad_minima: '' });
                    }}
                    className={errors.cantidad_minima ? 'border-destructive' : ''}
                    required
                  />
                  {errors.cantidad_minima && (
                    <p className="text-xs text-destructive">{errors.cantidad_minima}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="unidad_medida">Unidad</Label>
                  <Select
                    value={formData.unidad_medida}
                    onValueChange={(value) => setFormData({ ...formData, unidad_medida: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidades">Unidades</SelectItem>
                      <SelectItem value="kg">Kilogramos</SelectItem>
                      <SelectItem value="litros">Litros</SelectItem>
                      <SelectItem value="docenas">Docenas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Recetas vinculadas section */}
            {editingProduct && (
              <div className="border-t pt-4">
                <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Link className="size-4" />
                  Recetas vinculadas
                </h4>

                {/* Add receta form */}
                <div className="mb-3 flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[180px]">
                    <Label className="text-xs">Receta</Label>
                    <Select
                      value={selectedRecetaId.toString()}
                      onValueChange={(v) => setSelectedRecetaId(v ? parseInt(v) : '')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar receta..." />
                      </SelectTrigger>
                      <SelectContent>
                        {todasLasRecetas
                          .filter((r) => !recetasVinculadas.some((v) => v.receta_id === r.id))
                          .map((r) => (
                            <SelectItem key={r.id} value={r.id.toString()}>
                              {r.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={cantidadReceta}
                      onChange={(e) => setCantidadReceta(parseFloat(e.target.value) || 1)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleVincularReceta}
                    disabled={!selectedRecetaId}
                  >
                    <Plus className="size-4" />
                    Vincular
                  </Button>
                </div>

                {/* Linked recetas list */}
                <div className="space-y-1 rounded-lg bg-muted/30 p-3">
                  {recetasVinculadas.length === 0 && (
                    <p className="text-xs text-muted-foreground">No hay recetas vinculadas</p>
                  )}
                  {recetasVinculadas.map((receta) => (
                    <div
                      key={receta.receta_id}
                      className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0"
                    >
                      <span className="text-sm font-medium">{receta.nombre}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Cant: {receta.cantidad_receta}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDesvincularReceta(receta.receta_id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              <Button type="submit">{editingProduct ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventario;
