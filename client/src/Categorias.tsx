import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from './services/api';
import { useNotification } from './contexts/NotificationContext';
import { useConfirm } from './contexts/ConfirmContext';
import { useReducedMotion } from './lib/animations';
import { categoriaSchema, categoriaUpdateSchema } from './schemas/categoria.schema';
import './Categorias.css';

interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  created_at: string;
}

const Categorias: React.FC = () => {
  const { showNotification } = useNotification();
  const confirm = useConfirm();
  const { fadeUp, staggerContainer } = useReducedMotion();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cargarCategorias = async () => {
    setLoading(true);
    try {
      const response = await api.get<Categoria[]>('/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const validateForm = (): boolean => {
    const schema = editingCategoria ? categoriaUpdateSchema : categoriaSchema;
    const data = editingCategoria
      ? { nombre: formData.nombre, descripcion: formData.descripcion }
      : formData;
    const result = schema.safeParse(data);
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
      if (editingCategoria) {
        await api.put(`/categorias/${editingCategoria.id}`, formData);
      } else {
        await api.post('/categorias', formData);
      }
      setShowModal(false);
      resetForm();
      cargarCategorias();
      showNotification(
        editingCategoria ? 'Categoría actualizada!' : 'Categoría creada con éxito! ✨',
        'success',
      );
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg = err.response?.data?.message || 'Hubo un error al guardar la categoría.';
      showNotification(errorMsg, 'error');
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Categoría',
      message:
        '¿Estás seguro de eliminar esta categoría? Esto podría afectar a los productos asociados.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/categorias/${id}`);
      cargarCategorias();
      showNotification('Categoría eliminada', 'info');
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      showNotification('No se pudo eliminar la categoría.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
    });
    setEditingCategoria(null);
  };

  if (loading) {
    return <div className="loading">Cargando categorías...</div>;
  }

  return (
    <div className="categorias-container">
      <motion.header
        className="categorias-header"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div>
          <h1>🏷️ Gestión de Categorías</h1>
          <p>Organiza tus productos por tipo</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
            setErrors({});
          }}
        >
          ➕ Nueva Categoría
        </button>
      </motion.header>

      <motion.div
        className="categorias-grid"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {categorias.map((categoria) => (
          <motion.div key={categoria.id} variants={fadeUp} layout>
            <div className="categoria-card card">
              <div className="categoria-content">
                <h3>{categoria.nombre}</h3>
                <p>{categoria.descripcion || 'Sin descripción'}</p>
              </div>
              <div className="categoria-actions">
                <button className="btn-icon" onClick={() => handleEdit(categoria)} title="Editar">
                  ✏️
                </button>
                <button
                  className="btn-icon btn-danger"
                  onClick={() => handleDelete(categoria.id)}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowModal(false);
            setErrors({});
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <motion.div variants={fadeUp}>
              <div className="modal-header">
              <h2>{editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
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
              <div className="form-group">
                <label>Nombre de la Categoría *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData({ ...formData, nombre: e.target.value });
                    if (errors.nombre) setErrors({ ...errors, nombre: '' });
                  }}
                  className={errors.nombre ? 'input-error' : ''}
                  required
                  placeholder="Ej: Tortas, Panes, Cookies..."
                />
                {errors.nombre && <span className="field-error">{errors.nombre}</span>}
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => {
                    setFormData({ ...formData, descripcion: e.target.value });
                    if (errors.descripcion) setErrors({ ...errors, descripcion: '' });
                  }}
                  rows={3}
                  placeholder="Breve descripción de la categoría..."
                />
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
                  {editingCategoria ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categorias;
