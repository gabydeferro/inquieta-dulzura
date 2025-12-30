import React, { useState, useEffect } from 'react';
import api from './services/api';
import { useConfirm } from './contexts/ConfirmContext';
import './Recetas.css';

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
    ingredientes: []
  });
  const [selectedIngredienteId, setSelectedIngredienteId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number>(0);

  useEffect(() => {
    cargarRecetas();
  }, []);

  useEffect(() => {
    if (showModal) {
      cargarIngredientes();
    }
  }, [showModal]);

  const cargarIngredientes = async () => {
    try {
      const response = await api.get<IngredienteDB[]>('/ingredientes');
      setIngredientesDisponibles(response.data);
    } catch (error) {
      console.error('Error al cargar ingredientes:', error);
    }
  };

  const cargarRecetas = async () => {
    try {
      // Datos mock por ahora
      setRecetas([
        {
          id: 1,
          nombre: 'Torta de Chocolate',
          descripcion: 'Deliciosa torta de chocolate con cobertura',
          instrucciones: '1. Precalentar el horno a 180°C\n2. Mezclar ingredientes secos\n3. Agregar ingredientes húmedos\n4. Hornear por 35 minutos',
          tiempo_preparacion: 60,
          porciones: 8,
          activo: true,
          ingredientes: [
            { id: 1, nombre: 'Harina', cantidad: 300, unidad_medida: 'gramos' },
            { id: 2, nombre: 'Azúcar', cantidad: 200, unidad_medida: 'gramos' },
            { id: 3, nombre: 'Chocolate', cantidad: 150, unidad_medida: 'gramos' },
            { id: 4, nombre: 'Huevos', cantidad: 3, unidad_medida: 'unidades' },
            { id: 5, nombre: 'Mantequilla', cantidad: 100, unidad_medida: 'gramos' }
          ]
        },
        {
          id: 2,
          nombre: 'Pan Integral',
          descripcion: 'Pan artesanal integral',
          instrucciones: '1. Mezclar harina con levadura\n2. Agregar agua tibia\n3. Amasar por 10 minutos\n4. Dejar reposar 1 hora\n5. Hornear a 200°C por 30 minutos',
          tiempo_preparacion: 120,
          porciones: 12,
          activo: true,
          ingredientes: [
            { id: 6, nombre: 'Harina Integral', cantidad: 500, unidad_medida: 'gramos' },
            { id: 7, nombre: 'Levadura', cantidad: 10, unidad_medida: 'gramos' },
            { id: 8, nombre: 'Agua', cantidad: 300, unidad_medida: 'ml' },
            { id: 9, nombre: 'Sal', cantidad: 10, unidad_medida: 'gramos' }
          ]
        }
      ]);
    } catch (error) {
      console.error('Error al cargar recetas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (receta: Receta) => {
    setSelectedReceta(receta);
    setShowDetailModal(true);
  };

  const handlePrint = (receta: Receta) => {
    // Implementar impresión de receta
    console.log('Imprimir receta:', receta.nombre);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'tiempo_preparacion' || name === 'porciones' ? parseInt(value) || 0 : value
    }));
  };

  const handleAgregarIngrediente = () => {
    if (!selectedIngredienteId || cantidad <= 0) return;

    const ingrediente = ingredientesDisponibles.find(i => i.id === selectedIngredienteId);
    if (!ingrediente) return;

    const nuevoIngrediente: Ingrediente = {
      id: ingrediente.id,
      nombre: ingrediente.nombre,
      cantidad: cantidad,
      unidad_medida: ingrediente.unidad_medida
    };

    setFormData(prev => ({
      ...prev,
      ingredientes: [...(prev.ingredientes || []), nuevoIngrediente]
    }));

    setSelectedIngredienteId('');
    setCantidad(0);
  };

  const handleEliminarIngrediente = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes?.filter((_, i) => i !== index)
    }));
  };

  const handleGuardarReceta = () => {
    // Validación básica
    if (!formData.nombre) {
      alert('El nombre de la receta es requerido');
      return;
    }

    // Por ahora solo agregamos a la lista local
    const nuevaReceta: Receta = {
      id: recetas.length + 1,
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      instrucciones: formData.instrucciones,
      tiempo_preparacion: formData.tiempo_preparacion,
      porciones: formData.porciones,
      activo: true,
      ingredientes: formData.ingredientes
    };

    setRecetas([...recetas, nuevaReceta]);
    setShowModal(false);

    // Reset form
    setFormData({
      nombre: '',
      descripcion: '',
      instrucciones: '',
      tiempo_preparacion: 0,
      porciones: 0,
      ingredientes: []
    });
  };

  const handleEliminarReceta = async (id: number) => {
    const confirmed = await confirm({ message: '¿Estás seguro de eliminar esta receta?' });
    if (!confirmed) return;

    setRecetas(recetas.filter(r => r.id !== id));
  };

  if (loading) {
    return <div className="loading">Cargando recetas...</div>;
  }

  return (
    <div className="recetas-container">
      <header className="recetas-header">
        <div>
          <h1>📖 Recetas</h1>
          <p>Recetas de productos de la pastelería</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Nueva Receta
        </button>
      </header>

      <div className="recetas-grid">
        {recetas.map(receta => (
          <div key={receta.id} className="receta-card">
            <div className="receta-header">
              <h3>{receta.nombre}</h3>
              <div className="receta-meta">
                {receta.tiempo_preparacion && (
                  <span className="meta-item">
                    ⏱️ {receta.tiempo_preparacion} min
                  </span>
                )}
                {receta.porciones && (
                  <span className="meta-item">
                    🍰 {receta.porciones} porciones
                  </span>
                )}
              </div>
            </div>

            <p className="receta-descripcion">{receta.descripcion}</p>

            <div className="ingredientes-preview">
              <h4>Ingredientes ({receta.ingredientes?.length || 0})</h4>
              <ul>
                {receta.ingredientes?.slice(0, 3).map(ing => (
                  <li key={ing.id}>
                    {ing.nombre} - {ing.cantidad} {ing.unidad_medida}
                  </li>
                ))}
                {(receta.ingredientes?.length || 0) > 3 && (
                  <li className="more">+ {(receta.ingredientes?.length || 0) - 3} más...</li>
                )}
              </ul>
            </div>

            <div className="receta-actions">
              <button className="btn-secondary" onClick={() => handleViewDetail(receta)}>
                👁️ Ver Detalle
              </button>
              <button className="btn-icon" onClick={() => handlePrint(receta)} title="Imprimir">
                🖨️
              </button>
              <button
                className="btn-icon btn-danger"
                onClick={() => handleEliminarReceta(receta.id)}
                title="Eliminar"
                style={{ color: '#ff5252' }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalle */}
      {showDetailModal && selectedReceta && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedReceta.nombre}</h2>
              <button className="btn-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>

            <div className="receta-detail">
              <div className="detail-section">
                <h3>📝 Descripción</h3>
                <p>{selectedReceta.descripcion}</p>
              </div>

              <div className="detail-meta">
                <div className="meta-card">
                  <span className="meta-icon">⏱️</span>
                  <div>
                    <div className="meta-label">Tiempo</div>
                    <div className="meta-value">{selectedReceta.tiempo_preparacion} min</div>
                  </div>
                </div>
                <div className="meta-card">
                  <span className="meta-icon">🍰</span>
                  <div>
                    <div className="meta-label">Porciones</div>
                    <div className="meta-value">{selectedReceta.porciones}</div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>🥘 Ingredientes</h3>
                <div className="ingredientes-list">
                  {selectedReceta.ingredientes?.map(ing => (
                    <div key={ing.id} className="ingrediente-item">
                      <span className="ingrediente-nombre">{ing.nombre}</span>
                      <span className="ingrediente-cantidad">
                        {ing.cantidad} {ing.unidad_medida}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>👨‍🍳 Instrucciones</h3>
                <div className="instrucciones">
                  {selectedReceta.instrucciones?.split('\n').map((paso, index) => (
                    <div key={index} className="paso-item">
                      <span className="paso-numero">{index + 1}</span>
                      <span className="paso-texto">{paso}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-actions">
                <button className="btn btn-secondary" onClick={() => handlePrint(selectedReceta)}>
                  🖨️ Imprimir Receta
                </button>
                <button className="btn btn-primary" onClick={() => setShowDetailModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear/Editar Receta */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Receta</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="receta-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre || ''}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tiempo de Preparación (min)</label>
                  <input
                    type="number"
                    name="tiempo_preparacion"
                    value={formData.tiempo_preparacion || 0}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Porciones</label>
                  <input
                    type="number"
                    name="porciones"
                    value={formData.porciones || 0}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion || ''}
                  onChange={handleFormChange}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Ingredientes</label>
                <div className="ingrediente-selector">
                  <select
                    value={selectedIngredienteId}
                    onChange={(e) => setSelectedIngredienteId(e.target.value ? parseInt(e.target.value) : '')}
                  >
                    <option value="">Seleccionar ingrediente...</option>
                    {ingredientesDisponibles.map(ing => (
                      <option key={ing.id} value={ing.id}>
                        {ing.nombre} ({ing.unidad_medida})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={cantidad || ''}
                    onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
                    style={{ width: '120px' }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleAgregarIngrediente}>
                    + Agregar
                  </button>
                </div>

                <div className="ingredientes-list" style={{ marginTop: '1rem' }}>
                  {formData.ingredientes?.map((ing, index) => (
                    <div key={index} className="ingrediente-item">
                      <span className="ingrediente-nombre">{ing.nombre}</span>
                      <span className="ingrediente-cantidad">{ing.cantidad} {ing.unidad_medida}</span>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleEliminarIngrediente(index)}
                        style={{ color: '#ff5252' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Instrucciones</label>
                <textarea
                  name="instrucciones"
                  value={formData.instrucciones || ''}
                  onChange={handleFormChange}
                  rows={6}
                  placeholder="Escribe las instrucciones paso a paso..."
                />
              </div>
            </div>

            <div className="detail-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleGuardarReceta}>
                Guardar Receta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recetas;