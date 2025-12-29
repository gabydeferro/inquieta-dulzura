import React, { useState, useEffect } from 'react';
import api from './services/api';
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
  cliente?: string;
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
  const [formData, setFormData] = useState({
    cliente: '',
    metodo_pago: 'efectivo',
    descuento: '0'
  });

  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = async () => {
    try {
      // Datos mock
      setVentas([
        {
          id: 1,
          fecha_venta: new Date().toISOString(),
          cliente: 'Juan Pérez',
          subtotal: 50.00,
          descuento: 0,
          impuestos: 0,
          total: 50.00,
          metodo_pago: 'efectivo',
          estado: 'completada',
          productos: [
            {
              producto_id: 1,
              nombre: 'Torta de Chocolate',
              cantidad: 2,
              precio_unitario: 25.00,
              subtotal: 50.00
            }
          ]
        }
      ]);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarProducto = () => {
    const nuevoProducto: ProductoVenta = {
      producto_id: 1,
      nombre: 'Producto',
      cantidad: 1,
      precio_unitario: 0,
      subtotal: 0
    };
    setCarrito([...carrito, nuevoProducto]);
  };

  const actualizarProducto = (index: number, campo: string, valor: any) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito[index] = {
      ...nuevoCarrito[index],
      [campo]: valor
    };

    // Recalcular subtotal
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
    const total = subtotal - descuento;
    return { subtotal, descuento, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (carrito.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }

    const totales = calcularTotales();

    // Implementar creación de venta
    console.log('Nueva venta:', {
      ...formData,
      productos: carrito,
      ...totales
    });

    // Resetear formulario
    setCarrito([]);
    setFormData({
      cliente: '',
      metodo_pago: 'efectivo',
      descuento: '0'
    });
    setShowModal(false);
    cargarVentas();
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <h1>💰 Ventas</h1>
          <p>Registro y gestión de ventas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
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
              ${ventas.length > 0
                ? (ventas.reduce((sum, v) => sum + v.total, 0) / ventas.length).toFixed(2)
                : '0.00'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Ventas */}
      <div className="ventas-historial">
        <h2>Historial de Ventas</h2>
        <div className="ventas-list">
          {ventas.map(venta => (
            <div key={venta.id} className="venta-card">
              <div className="venta-header">
                <div>
                  <h3>Venta #{venta.id}</h3>
                  <p className="venta-fecha">{formatearFecha(venta.fecha_venta)}</p>
                </div>
                <div className="venta-total">${venta.total.toFixed(2)}</div>
              </div>

              <div className="venta-info">
                {venta.cliente && (
                  <div className="info-item">
                    <span className="label">Cliente:</span>
                    <span>{venta.cliente}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="label">Método de Pago:</span>
                  <span className="metodo-pago">{venta.metodo_pago}</span>
                </div>
                <div className="info-item">
                  <span className="label">Estado:</span>
                  <span className={`estado estado-${venta.estado}`}>
                    {venta.estado}
                  </span>
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Venta</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Cliente (opcional)</label>
                  <input
                    type="text"
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>

                <div className="form-group">
                  <label>Método de Pago</label>
                  <select
                    value={formData.metodo_pago}
                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="otro">Otro</option>
                  </select>
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
                              <input
                                type="text"
                                value={producto.nombre}
                                onChange={(e) => actualizarProducto(index, 'nombre', e.target.value)}
                                placeholder="Nombre del producto"
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={producto.cantidad}
                                onChange={(e) => actualizarProducto(index, 'cantidad', parseFloat(e.target.value))}
                                min="0.01"
                                step="0.01"
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={producto.precio_unitario}
                                onChange={(e) => actualizarProducto(index, 'precio_unitario', parseFloat(e.target.value))}
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
                    onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                    min="0"
                    step="0.01"
                    className="descuento-input"
                  />
                </div>
                <div className="totales-row total">
                  <span>Total:</span>
                  <span>${totales.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
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