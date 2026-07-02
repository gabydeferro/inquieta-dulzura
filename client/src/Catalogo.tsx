import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Cake, PackageOpen } from 'lucide-react';
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
    <div className="bg-background">
      <header className="bg-background px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/80 no-underline transition-opacity hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver al inicio
          </Link>
          <h1 className="mb-2 mt-4 text-3xl font-bold text-foreground sm:text-4xl">
            <Cake className="mr-2 inline-block size-8 align-middle text-brand-violet" />
            Nuestro Catálogo
          </h1>
          <p className="text-lg text-muted-foreground">
            Descubre todos nuestros productos artesanales
          </p>
        </div>
      </header>

      <section className="sticky top-0 z-30 border-b bg-card px-4 py-4 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap justify-center gap-2">
            {categoriasFiltro.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleFiltroClick(Number(cat.id))}
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-all ${
                  categoriaSeleccionada === cat.id
                    ? 'border-transparent bg-brand-violet text-white'
                    : 'border-border text-muted-foreground hover:border-brand-violet hover:text-brand-violet dark:text-foreground/70 dark:hover:text-brand-violet'
                }`}
              >
                {cat.nombre.charAt(0).toUpperCase() + cat.nombre.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              Cargando catálogo...
            </div>
          ) : error ? (
            <div className="py-16 text-center text-destructive">{error}</div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {productos.map((producto) => (
                  <Card
                    key={producto.id}
                    className="overflow-hidden transition-transform duration-500 hover:-translate-y-3 hover:shadow-xl"
                  >
                    <div className="flex h-48 items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30">
                      <Cake className="size-16 text-foreground/20" />
                    </div>
                    <CardContent className="p-4">
                      <Badge
                        variant="secondary"
                        className="mb-2 bg-brand-accent text-xs font-semibold uppercase text-foreground dark:bg-brand-accent/40"
                      >
                        {producto.categoriaNombre}
                      </Badge>
                      <h3 className="text-lg font-semibold text-foreground">
                        {producto.nombre}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {producto.descripcion}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t pt-4 dark:border-border">
                        <span className="font-[var(--font-titles)] text-xl font-bold text-foreground">
                          ${producto.precio ? Number(producto.precio).toFixed(2) : '0.00'}
                        </span>
                        <Button size="sm" className="bg-brand-violet text-white hover:bg-brand-violet/90">
                          Consultar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {productos.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                  <PackageOpen className="size-12" />
                  <p className="text-lg">No hay productos en esta categoría</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-br from-brand-violet to-purple-900 px-4 py-16 text-center text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            ¿Quieres gestionar tu propia pastelería?
          </h2>
          <p className="mb-8 text-lg text-white/90">
            Únete a nuestra plataforma y administra tu negocio de forma profesional
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-white text-brand-violet hover:bg-white/90">
                Registrarse Gratis
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-brand-violet"
              >
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Catalogo;
