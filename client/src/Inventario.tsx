import React, { useState, useEffect } from 'react';
import api from './services/api';
import { useNotification } from './contexts/NotificationContext';
import { useConfirm } from './contexts/ConfirmContext';
import { inventarioCreateSchema, inventarioUpdateSchema } from './schemas/inventario.schema';
import './Inventario.css';

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

  const cargarCategorias = async () => {
    try {
      const response = await api.get('/categorias');
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
      const response = await api.get('/productos');
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

  const handleEdit = (producto: ProductoConStock) => {
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
  };

  const getStockStatus = (producto: ProductoConStock) => {
    if (!producto.stock) return 'sin-stock';
    if (producto.stock.cantidad_disponible <= producto.stock.cantidad_minima) return 'stock-bajo';
    return 'stock-ok';
  };

  if (loading) {
    return <div className="loading">Cargando inventario...</div>;
  }

  return (
    <div className="inventario-container">
      <header className="inventario-header">
        <div>
          <h1>📦 Inventario de Productos</h1>
          <p>Gestión de productos y stock</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
            setErrors({});
          }}
        >
          ➕ Nuevo Producto
        </button>
      </header>

      <div className="productos-grid">
        {productos.map((producto) => (
          <div key={producto.id} className={`producto-card ${getStockStatus(producto)}`}>
            <div className="producto-header">
              <h3>{producto.nombre}</h3>
              {producto.sku && <span className="sku">{producto.sku}</span>}
            </div>

            <p className="producto-descripcion">{producto.descripcion}</p>

            <div className="producto-precios">
              <div className="precio-item">
                <span className="label">Precio:</span>
                <span className="valor">${Number(producto.precio).toFixed(2)}</span>
              </div>
              {producto.costo && (
                <div className="precio-item">
                  <span className="label">Costo:</span>
                  <span className="valor">${Number(producto.costo).toFixed(2)}</span>
                </div>
              )}
            </div>

            {producto.stock && (
              <div className="producto-stock">
                <div className="stock-info">
                  <span className="stock-cantidad">
                    {producto.stock.cantidad_disponible} {producto.stock.unidad_medida}
                  </span>
                  <span className="stock-minimo">Mín: {producto.stock.cantidad_minima}</span>
                </div>
                {producto.stock.cantidad_disponible <= producto.stock.cantidad_minima && (
                  <div className="stock-alerta">⚠️ Stock bajo</div>
                )}
              </div>
            )}

            <div className="producto-actions">
              <button className="btn-icon" onClick={() => handleEdit(producto)} title="Editar">
                ✏️
              </button>
              <button
                className="btn-icon btn-danger"
                onClick={() => handleDelete(producto.id)}
                title="Eliminar"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowModal(false);
            setErrors({});
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button
                className="btn-close"
                onClick={() => {
                  setShowModal(false);
                  setErrors({});
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => {
                      setFormData({ ...formData, nombre: e.target.value });
                      if (errors.nombre) setErrors({ ...errors, nombre: '' });
                    }}
                    className={errors.nombre ? 'input-error' : ''}
                    required
                  />
                  {errors.nombre && <span className="field-error">{errors.nombre}</span>}
                </div>

                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => {
                      setFormData({ ...formData, categoria_id: e.target.value });
                      if (errors.categoria_id) setErrors({ ...errors, categoria_id: '' });
                    }}
                    className={errors.categoria_id ? 'input-error' : ''}
                    required
                  >
                    <option value="" disabled>
                      Seleccionar...
                    </option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.categoria_id && (
                    <span className="field-error">{errors.categoria_id}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => {
                      setFormData({ ...formData, precio: e.target.value });
                      if (errors.precio) setErrors({ ...errors, precio: '' });
                    }}
                    className={errors.precio ? 'input-error' : ''}
                    required
                  />
                  {errors.precio && <span className="field-error">{errors.precio}</span>}
                </div>

                <div className="form-group">
                  <label>Costo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costo}
                    onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cantidad Disponible *</label>
                  <input
                    type="number"
                    value={formData.cantidad_disponible}
                    onChange={(e) => {
                      setFormData({ ...formData, cantidad_disponible: e.target.value });
                      if (errors.cantidad_disponible)
                        setErrors({ ...errors, cantidad_disponible: '' });
                    }}
                    className={errors.cantidad_disponible ? 'input-error' : ''}
                    required
                  />
                  {errors.cantidad_disponible && (
                    <span className="field-error">{errors.cantidad_disponible}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Cantidad Mínima *</label>
                  <input
                    type="number"
                    value={formData.cantidad_minima}
                    onChange={(e) => {
                      setFormData({ ...formData, cantidad_minima: e.target.value });
                      if (errors.cantidad_minima) setErrors({ ...errors, cantidad_minima: '' });
                    }}
                    className={errors.cantidad_minima ? 'input-error' : ''}
                    required
                  />
                  {errors.cantidad_minima && (
                    <span className="field-error">{errors.cantidad_minima}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Unidad</label>
                  <select
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                  >
                    <option value="unidades">Unidades</option>
                    <option value="kg">Kilogramos</option>
                    <option value="litros">Litros</option>
                    <option value="docenas">Docenas</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setErrors({});
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
