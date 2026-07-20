import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from './services/api';
import { Ingrediente, UnidadMedidaIngrediente } from './types/Ingrediente';
import { useNotification } from './contexts/NotificationContext';
import { useConfirm } from './contexts/ConfirmContext';
import { useReducedMotion } from './lib/animations';
import { ingredienteSchema, ingredienteUpdateSchema } from './schemas/ingrediente.schema';
import './Ingredientes.css';

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
        // Update existing ingrediente
        await api.updateIngrediente(editingIngrediente.id, editingIngrediente);
        showNotification('Ingrediente actualizado con éxito', 'success');
      } else {
        // Create new ingrediente
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

  const handleDelete = async (id: number) => {
    const result = await confirm({
      message: '¿Estás seguro de que quieres eliminar este ingrediente?',
    });
    if (result) {
      try {
        await api.deleteIngrediente(id);
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
      activo: true, // Default to active
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setEditingIngrediente((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value,
      };
    });
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  return (
    <div className="inventario-container">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h2>Gestión de Ingredientes</h2>
        <button className="add-button" onClick={openCreateModal}>
          Agregar Ingrediente
        </button>
      </motion.div>

      <div className="table-responsive">
        <table className="inventario-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Unidad de Medida</th>
              <th>Costo Unitario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
            {ingredientes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No hay ingredientes cargados
                </td>
              </tr>
            ) : (
              ingredientes.map((ingrediente) => (
                <motion.tr key={ingrediente.id} variants={fadeUp}>
                  <td>{ingrediente.nombre}</td>
                  <td>{ingrediente.descripcion}</td>
                  <td>{ingrediente.unidad_medida}</td>
                  <td>
                    {ingrediente.costo_unitario
                      ? `$${Number(ingrediente.costo_unitario).toFixed(2)}`
                      : '$0.00'}
                  </td>
                  <td>
                    <button className="edit-button" onClick={() => openEditModal(ingrediente)}>
                      Editar
                    </button>
                    <button className="delete-button" onClick={() => handleDelete(ingrediente.id!)}>
                      Eliminar
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </motion.tbody>
        </table>
      </div>

      {isModalOpen && editingIngrediente && (
        <div className="modal-overlay">
          <div className="modal-content">
            <motion.div variants={fadeUp}>
              <h3>{editingIngrediente.id ? 'Editar Ingrediente' : 'Crear Ingrediente'}</h3>
            <form onSubmit={handleCreateEdit} noValidate>
              <div className="form-group">
                <label htmlFor="nombre">Nombre:</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={editingIngrediente.nombre}
                  onChange={handleChange}
                  required
                  className={errors.nombre ? 'input-error' : ''}
                />
                {errors.nombre && <span className="field-error">{errors.nombre}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="descripcion">Descripción:</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={editingIngrediente.descripcion || ''}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="unidad_medida">Unidad de Medida:</label>
                  <select
                    id="unidad_medida"
                    name="unidad_medida"
                    value={editingIngrediente.unidad_medida}
                    onChange={handleChange}
                    required
                  >
                    {unidades.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  {errors.unidad_medida && (
                    <span className="field-error">{errors.unidad_medida}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="costo_unitario">Costo Unitario:</label>
                  <input
                    type="number"
                    id="costo_unitario"
                    name="costo_unitario"
                    value={editingIngrediente.costo_unitario || 0}
                    onChange={handleChange}
                    step="0.01"
                    className={errors.costo_unitario ? 'input-error' : ''}
                  />
                  {errors.costo_unitario && (
                    <span className="field-error">{errors.costo_unitario}</span>
                  )}
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">
                  Guardar
                </button>
                <button type="button" className="cancel-button" onClick={closeModal}>
                  Cancelar
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

export default Ingredientes;
