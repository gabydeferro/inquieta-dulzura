import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Catalogo.css';
import apiService from './services/api';

// Interfaces que coinciden con los DTOs del backend
interface CategoriaDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

interface ProductoDTO {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  // Opcional: añadir más campos si se quieren mostrar, como 'sku' o 'costo'
  // AÑADIR campo categoriaNombre para facilitar la visualización
  categoriaNombre?: string;
  imagen?: string; // Placeholder, la API de productos aún no sirve imágenes
}

const Catalogo: React.FC = () => {
  const [productos, setProductos] = useState<ProductoDTO[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | 'todas'>('todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar categorías y productos en paralelo
        const [categoriasRes, productosRes] = await Promise.all([
          apiService.getCategorias<CategoriaDTO[]>(),
          apiService.getProductos<ProductoDTO[]>(),
        ]);

        // Mapear nombres de categoría a productos
        const categoriasMap = new Map(categoriasRes.data.map((c) => [c.id, c.nombre]));
        const productosConCategoria = productosRes.data.map((p) => ({
          ...p,
          categoriaNombre: categoriasMap.get(p.categoria_id) || 'Sin categoría',
        }));

        setCategorias(categoriasRes.data);
        setProductos(productosConCategoria);
      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
        setError('No se pudieron cargar los productos. Inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatosIniciales();
  }, []);

  const handleFiltroClick = async (id: number | 'todas') => {
    setCategoriaSeleccionada(id);
    setLoading(true);
    setError(null);
    try {
      let productosRes;
      if (id === 'todas') {
        productosRes = await apiService.getProductos<ProductoDTO[]>();
      } else {
        productosRes = await apiService.getProductosByCategoria<ProductoDTO[]>(id);
      }

      // Mapear nombres de categoría a productos
      const categoriasMap = new Map(categorias.map((c) => [c.id, c.nombre]));
      const productosConCategoria = productosRes.data.map((p) => ({
        ...p,
        categoriaNombre: categoriasMap.get(p.categoria_id) || 'Sin categoría',
      }));

      setProductos(productosConCategoria);
    } catch (err) {
      console.error(`Error al filtrar por categoría ${id}:`, err);
      setError('Error al filtrar los productos.');
    } finally {
      setLoading(false);
    }
  };

  const categoriasFiltro = [{ id: 'todas', nombre: 'Todas' }, ...categorias];

  return (
    <div className="catalogo-page">
      <header className="catalogo-header">
        <div className="container">
          <Link to="/" className="back-link">
            ← Volver al inicio
          </Link>
          <h1>🍰 Nuestro Catálogo</h1>
          <p>Descubre todos nuestros productos artesanales</p>
        </div>
      </header>

      <section className="filtros-section">
        <div className="container">
          <div className="filtros">
            {categoriasFiltro.map((cat) => (
              <button
                key={cat.id}
                className={`filtro-btn ${categoriaSeleccionada === cat.id ? 'active' : ''}`}
                onClick={() => handleFiltroClick(Number(cat.id))}
              >
                {cat.nombre.charAt(0).toUpperCase() + cat.nombre.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="productos-section">
        <div className="container">
          {loading ? (
            <div className="loading">Cargando catálogo...</div>
          ) : error ? (
            <div className="error-productos">{error}</div>
          ) : (
            <>
              <div className="productos-grid">
                {productos.map((producto) => (
                  <div key={producto.id} className="producto-card">
                    <div className="producto-imagen">
                      {/* Placeholder para la imagen */}
                      {'🎂'}
                    </div>
                    <div className="producto-info">
                      <span className="producto-categoria">{producto.categoriaNombre}</span>
                      <h3>{producto.nombre}</h3>
                      <p>{producto.descripcion}</p>
                      <div className="producto-footer">
                        <span className="producto-precio">
                          ${producto.precio ? Number(producto.precio).toFixed(2) : '0.00'}
                        </span>
                        <button className="btn-contacto">Consultar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {productos.length === 0 && (
                <div className="no-productos">
                  <p>No hay productos en esta categoría</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="cta-catalogo">
        <div className="container">
          <h2>¿Quieres gestionar tu propia pastelería?</h2>
          <p>Únete a nuestra plataforma y administra tu negocio de forma profesional</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary btn-large">
              Registrarse Gratis
            </Link>
            <Link to="/login" className="btn btn-outline btn-large">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Catalogo;
