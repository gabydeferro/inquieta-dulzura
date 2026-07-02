import React, { useState, useEffect, useCallback } from 'react';
import api from './services/api';
import { VentaResponse, VentaDetalleInput, VentaCreateInput } from './types/Venta';
import { ventaCreateSchema } from './schemas/venta.schema';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DollarSign,
  Plus,
  Trash2,
  BarChart3,
  TrendingUp,
  X,
} from 'lucide-react';

interface ProductoVenta {
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

const Ventas: React.FC = () => {
  const [ventas, setVentas] = useState<VentaResponse[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carrito, setCarrito] = useState<ProductoVenta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    cliente: '',
    metodo_pago: 'efectivo',
    descuento: '0',
  });

  const cargarVentas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getVentas<VentaResponse[]>();
      setVentas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      setError('Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarVentas();
  }, [cargarVentas]);

  const agregarProducto = () => {
    const nuevoProducto: ProductoVenta = {
      producto_id: Date.now(), // temporary unique id
      nombre: 'Producto',
      cantidad: 1,
      precio_unitario: 0,
      subtotal: 0,
    };
    setCarrito([...carrito, nuevoProducto]);
  };

  const actualizarProducto = (index: number, campo: string, valor: string | number) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito[index] = {
      ...nuevoCarrito[index],
      [campo]: valor,
    };

    if (campo === 'cantidad' || campo === 'precio_unitario') {
      nuevoCarrito[index].subtotal =
        nuevoCarrito[index].cantidad * nuevoCarrito[index].precio_unitario;
    }

    setCarrito(nuevoCarrito);
  };

  const eliminarProducto = (index: number) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const calcularTotales = () => {
    const subtotal = carrito.reduce((sum, item) => sum + item.subtotal, 0);
    const descuento = parseFloat(formData.descuento) || 0;
    const total = Math.max(0, subtotal - descuento);
    return { subtotal, descuento, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setError(null);

    // Build payload for validation
    const productosPayload: VentaDetalleInput[] = carrito.map((item) => ({
      producto_id: item.producto_id,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal: item.subtotal,
    }));

    const payload: Record<string, unknown> = {
      metodo_pago: formData.metodo_pago,
      descuento: formData.descuento,
      productos: productosPayload,
    };

    if (formData.cliente.trim()) {
      payload.cliente = formData.cliente.trim();
    }

    // Validate with schema
    const result = ventaCreateSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setValidationErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const ventaData: VentaCreateInput = result.data;
      await api.createVenta(ventaData);
      setCarrito([]);
      setFormData({
        cliente: '',
        metodo_pago: 'efectivo',
        descuento: '0',
      });
      setShowModal(false);
      cargarVentas();
    } catch (error) {
      console.error('Error al registrar la venta:', error);
      setError('Error al registrar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totales = calcularTotales();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Cargando ventas...
      </div>
    );
  }

  if (error && ventas.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
              <DollarSign className="size-7 sm:size-8 lg:size-9 text-brand-violet" />
              Ventas
            </h1>
            <p className="text-muted-foreground">Registro y gestión de ventas</p>
          </div>
        </header>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
            <DollarSign className="size-7 sm:size-8 lg:size-9 text-brand-violet" />
            Ventas
          </h1>
          <p className="text-muted-foreground">Registro y gestión de ventas</p>
        </div>
        <Button onClick={() => { setShowModal(true); setError(null); setValidationErrors({}); }}>
          <Plus className="size-4" />
          Nueva Venta
        </Button>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <BarChart3 className="size-8 text-muted-foreground" />
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                Ventas Hoy
              </p>
              <p className="text-2xl font-bold text-foreground">{ventas.length}</p>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <DollarSign className="size-8 text-muted-foreground" />
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                Total Hoy
              </p>
              <p className="text-2xl font-bold text-foreground">
                ${ventas.reduce((sum, v) => sum + v.total, 0).toFixed(2)}
              </p>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <TrendingUp className="size-8 text-muted-foreground" />
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                Promedio
              </p>
              <p className="text-2xl font-bold text-foreground">
                $
                {ventas.length > 0
                  ? (ventas.reduce((sum, v) => sum + v.total, 0) / ventas.length).toFixed(2)
                  : '0.00'}
              </p>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Sales History */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-foreground">Historial de Ventas</h2>
        <div className="space-y-4">
          {ventas.map((venta) => (
            <Card key={venta.id} className="border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base">Venta #{venta.id}</CardTitle>
                  <p className="text-xs text-muted-foreground">{formatearFecha(venta.fecha_venta)}</p>
                </div>
                <span className="text-xl font-bold text-emerald-600">
                  ${venta.total.toFixed(2)}
                </span>
              </CardHeader>

              <CardContent>
                <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {venta.cliente && (
                    <div>
                      <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                        Cliente
                      </p>
                      <p className="text-sm text-foreground">{venta.cliente}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                      Método de Pago
                    </p>
                    <span className="inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {venta.metodo_pago}
                    </span>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                      Estado
                    </p>
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      venta.estado === 'completada'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : venta.estado === 'pendiente'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                    }`}>
                      {venta.estado}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    Productos ({venta.productos.length})
                  </p>
                  <ul className="space-y-1">
                    {venta.productos.map((prod, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">
                        {prod.cantidad}x {prod.nombre} — ${prod.subtotal.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* New Sale Dialog */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowModal(false);
            setError(null);
            setValidationErrors({});
          }
        }}
      >
        <DialogContent className="sm:max-w-[650px]">
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="size-5 text-brand-violet" />
                Nueva Venta
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="cliente">Cliente (opcional)</Label>
                  <Input
                    id="cliente"
                    type="text"
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="metodo_pago">Método de Pago</Label>
                  <select
                    id="metodo_pago"
                    value={formData.metodo_pago}
                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Products */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Productos</Label>
                  <Button type="button" variant="outline" size="sm" onClick={agregarProducto}>
                    <Plus className="size-3.5" />
                    Agregar Producto
                  </Button>
                </div>

                {validationErrors.productos && (
                  <p className="mb-2 text-xs text-destructive">{validationErrors.productos}</p>
                )}

                {carrito.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No hay productos. Agrega productos a la venta.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {carrito.map((producto, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                type="text"
                                value={producto.nombre}
                                onChange={(e) =>
                                  actualizarProducto(index, 'nombre', e.target.value)
                                }
                                placeholder="Nombre del producto"
                                required
                                className="h-7 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={producto.cantidad}
                                onChange={(e) =>
                                  actualizarProducto(index, 'cantidad', parseFloat(e.target.value))
                                }
                                min="0.01"
                                step="0.01"
                                required
                                className="h-7 w-20 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={producto.precio_unitario}
                                onChange={(e) =>
                                  actualizarProducto(
                                    index,
                                    'precio_unitario',
                                    parseFloat(e.target.value),
                                  )
                                }
                                min="0"
                                step="0.01"
                                required
                                className="h-7 w-20 text-xs"
                              />
                            </TableCell>
                            <TableCell className="font-semibold">
                              ${producto.subtotal.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => eliminarProducto(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm">Subtotal:</span>
                  <span className="text-sm font-semibold">${totales.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm">Descuento:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={formData.descuento}
                      onChange={(e) => {
                        setFormData({ ...formData, descuento: e.target.value });
                        if (validationErrors.descuento) {
                          setValidationErrors((prev) => {
                            const next = { ...prev };
                            delete next.descuento;
                            return next;
                          });
                        }
                      }}
                      min="0"
                      step="0.01"
                      className="descuento-input h-7 w-24 text-right text-xs"
                    />
                  </div>
                </div>
                {validationErrors.descuento && (
                  <p className="text-xs text-destructive">{validationErrors.descuento}</p>
                )}
                <div className="mt-1 flex items-center justify-between border-t pt-2">
                  <span className="text-base font-bold">Total:</span>
                  <span className="text-lg font-bold text-emerald-600">
                    ${totales.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                  setValidationErrors({});
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Registrar Venta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ventas;
