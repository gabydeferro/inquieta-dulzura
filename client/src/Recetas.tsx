import React, { useState, useEffect } from 'react';
import api from './services/api';
import './Recetas.css';

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
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    cargarRecetas();
  }, []);

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
    </div>
  );
};

export default Recetas;