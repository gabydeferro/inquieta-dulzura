import React, { useState, useEffect, useCallback } from 'react';
import api from './services/api';
import { useCart } from './contexts/CartContext';
import { MetodoPago } from './types/Cart';
import ProductSearch from './components/ProductSearch';
import CartSummary from './components/CartSummary';
import PaymentSelector from './components/PaymentSelector';
import { Producto } from './types/Producto';
import { VentaResponse } from './types/Venta';
import { ventaCreateSchema } from './schemas/venta.schema';
import { useNotification } from './contexts/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, BarChart3, TrendingUp } from 'lucide-react';

const Ventas: React.FC = () => {
  const { items, total, itemCount, dispatch } = useCart();
  const { showNotification } = useNotification();
  const [ventas, setVentas] = useState<VentaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarVentas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getVentas();
      if (Array.isArray(response.data)) {
        setVentas(response.data);
      }
    } catch {
      console.warn('Error al cargar ventas desde API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarVentas();
  }, [cargarVentas]);

  const handleAddToCart = (product: Producto) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        producto_id: product.id,
        nombre: product.nombre,
        precio: product.precio,
        stock_disponible: product.stock ?? 0,
        imagen: product.imagen_url,
      },
    });
  };

  const handleUpdateQuantity = (producto_id: number, cantidad: number) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { producto_id, cantidad },
    });
  };

  const handleRemoveItem = (producto_id: number) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { producto_id },
    });
  };

  const handleConfirmSale = async (metodo: MetodoPago) => {
    setError(null);

    const productosPayload = items.map((item) => ({
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      subtotal: item.precio * item.cantidad,
    }));

    const payload = {
      metodo_pago: metodo,
      descuento: 0,
      productos: productosPayload,
    };

    const result = ventaCreateSchema.safeParse(payload);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || 'Error de validación';
      setError(firstError);
      showNotification(firstError, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createVenta(result.data);
      dispatch({ type: 'CLEAR_CART' });
      showNotification('Venta registrada exitosamente', 'success');
      cargarVentas();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar la venta';
      // Handle stock conflict from backend
      if (message.includes('Stock insuficiente') || message.includes('insufficient stock')) {
        setError('Stock insuficiente para uno o más productos');
        showNotification('Stock insuficiente para uno o más productos', 'error');
      } else {
        setError(message);
        showNotification(message, 'error');
      }
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

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Cargando ventas...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
          <DollarSign className="size-7 sm:size-8 lg:size-9 text-brand-violet" />
          Ventas
        </h1>
        <p className="text-muted-foreground">Punto de venta</p>
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

      {/* POS Layout: Search + Cart */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Product Search */}
        <div>
          <h2 className="mb-3 text-lg font-bold text-foreground">Buscar Productos</h2>
          <ProductSearch onAddToCart={handleAddToCart} />
        </div>

        {/* Right: Cart Summary */}
        <div>
          <h2 className="mb-3 text-lg font-bold text-foreground">Carrito</h2>
          <CartSummary
            items={items}
            total={total}
            itemCount={itemCount}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveItem}
          />
        </div>
      </div>

      {/* Payment Selector */}
      <PaymentSelector total={total} isSubmitting={isSubmitting} onConfirm={handleConfirmSale} />

      {/* Sales History */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-foreground">Historial de Ventas</h2>
        <div className="space-y-4">
          {ventas.map((venta) => (
            <Card key={venta.id} className="border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base">Venta #{venta.id}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {formatearFecha(venta.fecha_venta)}
                  </p>
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
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        venta.estado === 'completada'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : venta.estado === 'pendiente'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      }`}
                    >
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
    </div>
  );
};

export default Ventas;
