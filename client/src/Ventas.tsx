import React, { useState, useEffect } from 'react';
import api from './services/api';
import { useNotification } from './contexts/NotificationContext';
import { ventaCreateSchema } from './schemas/venta.schema';
import './Ventas.css';

interface ProductoVenta {
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Venta {
  id: number;
  fecha_venta: string;
  cliente_nombre?: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  metodo_pago: string;
  estado: string;
  productos: ProductoVenta[];
}

const Ventas: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [carrito, setCarrito] = useState<ProductoVenta[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([]);
  const [productos, setProductos] = useState<{ id: number; nombre: string; precio: number }[]>([]);
  const [formData, setFormData] = useState({
    cliente_id: '',
    metodo_pago: 'efectivo',
    descuento: '0',
  });
  const { showNotification } = useNotification();

  const cargarVentas = async () => {
    try {
      const [ventasRes, clientesRes, productosRes] = await Promise.all([
        api.getVentas<Venta[]>(),
        api.getClientes<{ id: number; nombre: string }[]>(),
        api.get<{ id: number; nombre: string; precio: number }[]>('/productos'),
      ]);
      setVentas(ventasRes.data);
      setClientes(clientesRes.data);
      setProductos(productosRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarVentas();
  }, []);

  const agregarProducto = () => {
    const nuevoProducto: ProductoVenta = {
      producto_id: 0,
      nombre: '',
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

    // Auto-fill precio_unitario when product is selected
    if (campo === 'producto_id') {
      const producto = productos.find((p) => p.id === Number(valor));
      if (producto) {
        nuevoCarrito[index].nombre = producto.nombre;
        nuevoCarrito[index].precio_unitario = producto.precio;
      }
    }

    // Recalcular subtotal
    if (campo === 'cantidad' || campo === 'precio_unitario' || campo === 'producto_id') {
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
    const total = subtotal - descuento;
    return { subtotal, descuento, total };
  };

  const validateForm = (): boolean => {
    const data = {
      cliente_id: formData.cliente_id ? parseInt(formData.cliente_id) : undefined,
      metodo_pago: formData.metodo_pago,
      descuento: formData.descuento ? parseFloat(formData.descuento) : 0,
      productos: carrito.map((p) => ({
        producto_id: p.producto_id,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario,
        subtotal: p.subtotal,
      })),
    };

    const result = ventaCreateSchema.safeParse(data);
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
      await api.createVenta({
        cliente_id: formData.cliente_id ? parseInt(formData.cliente_id) : undefined,
        metodo_pago: formData.metodo_pago as 'efectivo' | 'tarjeta' | 'transferencia' | 'otro',
        descuento: parseFloat(formData.descuento) || 0,
        productos: carrito.map((p) => ({
          producto_id: p.producto_id,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          subtotal: p.subtotal,
        })),
      });

      showNotification('Venta registrada con éxito', 'success');
      setCarrito([]);
      setFormData({
        cliente_id: '',
        metodo_pago: 'efectivo',
        descuento: '0',
      });
      setErrors({});
      setShowModal(false);
      cargarVentas();
    } catch {
      showNotification('Error al registrar la venta', 'error');
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
    return <div className="loading">Cargando ventas...</div>;
  }

  return (
    <div className="ventas-container">
      <header className="ventas-header">
        <div>
          <h1>💵 Ventas</h1>
          <p>Registro y gestión de ventas</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setErrors({}); setShowModal(true); }}>
          ➕ Nueva Venta
        </button>
      </header>

      {/* Estadísticas */}
      <div className="stats-ventas">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <div className="stat-label">Ventas Hoy</div>
            <div className="stat-value">{ventas.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div>
            <div className="stat-label">Total Hoy</div>
            <div className="stat-value">
              ${ventas.reduce((sum, v) => sum + v.total, 0).toFixed(2)}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div>
            <div className="stat-label">Promedio</div>
            <div className="stat-value">
              $
              {ventas.length > 0
                ? (ventas.reduce((sum, v) => sum + v.total, 0) / ventas.length).toFixed(2)
                : '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Ventas */}
      <div className="ventas-historial">
        <h2>Historial de Ventas</h2>
        <div className="ventas-list">
          {ventas.map((venta) => (
            <div key={venta.id} className="venta-card">
              <div className="venta-header">
                <div>
                  <h3>Venta #{venta.id}</h3>
                  <p className="venta-fecha">{formatearFecha(venta.fecha_venta)}</p>
                </div>
                <div className="venta-total">${venta.total.toFixed(2)}</div>
              </div>

              <div className="venta-info">
                {venta.cliente_nombre && (
                  <div className="info-item">
                    <span className="label">Cliente:</span>
                    <span>{venta.cliente_nombre}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="label">Método de Pago:</span>
                  <span className="metodo-pago">{venta.metodo_pago}</span>
                </div>
                <div className="info-item">
                  <span className="label">Estado:</span>
                  <span className={`estado estado-${venta.estado}`}>{venta.estado}</span>
                </div>
              </div>

              <div className="venta-productos">
                <h4>Productos ({venta.productos.length})</h4>
                <ul>
                  {venta.productos.map((prod, idx) => (
                    <li key={idx}>
                      {prod.cantidad}x {prod.nombre} - ${prod.subtotal.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nueva Venta */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setErrors({}); }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Venta</h2>
              <button className="btn-close" onClick={() => { setShowModal(false); setErrors({}); }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label>Cliente (opcional)</label>
                  <select
                    value={formData.cliente_id}
                    onChange={(e) => {
                      setFormData({ ...formData, cliente_id: e.target.value });
                      if (errors.cliente_id) setErrors({ ...errors, cliente_id: '' });
                    }}
                    className={errors.cliente_id ? 'input-error' : ''}
                  >
                    <option value="">Sin cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.cliente_id && <span className="field-error">{errors.cliente_id}</span>}
                </div>

                <div className="form-group">
                  <label>Método de Pago</label>
                  <select
                    value={formData.metodo_pago}
                    onChange={(e) => {
                      setFormData({ ...formData, metodo_pago: e.target.value });
                      if (errors.metodo_pago) setErrors({ ...errors, metodo_pago: '' });
                    }}
                    className={errors.metodo_pago ? 'input-error' : ''}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="otro">Otro</option>
                  </select>
                  {errors.metodo_pago && (
                    <span className="field-error">{errors.metodo_pago}</span>
                  )}
                </div>
              </div>

              {/* Productos */}
              <div className="productos-section">
                <div className="section-header">
                  <h3>Productos</h3>
                  <button type="button" className="btn-add" onClick={agregarProducto}>
                    ➕ Agregar Producto
                  </button>
                </div>

                <div className="productos-table">
                  {carrito.length === 0 ? (
                    <p className="empty-message">No hay productos. Agrega productos a la venta.</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cantidad</th>
                          <th>Precio Unit.</th>
                          <th>Subtotal</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {carrito.map((producto, index) => (
                          <tr key={index}>
                            <td>
                              <select
                                value={producto.producto_id || ''}
                                onChange={(e) =>
                                  actualizarProducto(index, 'producto_id', parseInt(e.target.value))
                                }
                                required
                              >
                                <option value="">Seleccionar...</option>
                                {productos.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.nombre} - ${p.precio.toFixed(2)}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={producto.cantidad}
                                onChange={(e) =>
                                  actualizarProducto(index, 'cantidad', parseFloat(e.target.value))
                                }
                                min="0.01"
                                step="0.01"
                                required
                              />
                            </td>
                            <td>
                              <input
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
                              />
                            </td>
                            <td className="subtotal">${producto.subtotal.toFixed(2)}</td>
                            <td>
                              <button
                                type="button"
                                className="btn-remove"
                                onClick={() => eliminarProducto(index)}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {errors.productos && (
                    <span className="field-error">{errors.productos}</span>
                  )}
                </div>
              </div>

              {/* Totales */}
              <div className="totales-section">
                <div className="totales-row">
                  <span>Subtotal:</span>
                  <span>${totales.subtotal.toFixed(2)}</span>
                </div>
                <div className="totales-row">
                  <span>Descuento:</span>
                  <input
                    type="number"
                    value={formData.descuento}
                    onChange={(e) => {
                      setFormData({ ...formData, descuento: e.target.value });
                      if (errors.descuento) setErrors({ ...errors, descuento: '' });
                    }}
                    min="0"
                    step="0.01"
                    className={`descuento-input${errors.descuento ? ' input-error' : ''}`}
                  />
                </div>
                {errors.descuento && <span className="field-error">{errors.descuento}</span>}
                <div className="totales-row total">
                  <span>Total:</span>
                  <span>${totales.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowModal(false); setErrors({}); }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas;
