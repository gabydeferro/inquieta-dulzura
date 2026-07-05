import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Package,
  DollarSign,
  Camera,
  AlertTriangle,
  ClipboardList,
  BookOpen,
  ShoppingCart,
  Image,
  Tags,
} from 'lucide-react';

interface Stats {
  totalProductos: number;
  totalVentas: number;
  totalFotos: number;
  stockBajo: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalProductos: 0,
    totalVentas: 0,
    totalFotos: 0,
    stockBajo: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const [fotosRes] = await Promise.all([api.get('/fotos/estadisticas')]);

      setStats({
        totalProductos: 0,
        totalVentas: 0,
        totalFotos: fotosRes.data.total_fotos || 0,
        stockBajo: 0,
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Cargando dashboard...
      </div>
    );
  }

  const statCards = [
    { label: 'Productos', value: stats.totalProductos, icon: Package },
    { label: 'Ventas', value: stats.totalVentas, icon: DollarSign },
    { label: 'Fotos', value: stats.totalFotos, icon: Camera },
    { label: 'Stock Bajo', value: stats.stockBajo, icon: AlertTriangle, alert: true },
  ];

  const quickActions = [
    { to: '/inventario', label: 'Gestionar Inventario', desc: 'Ver y actualizar productos', icon: ClipboardList },
    { to: '/recetas', label: 'Ver Recetas', desc: 'Consultar recetas de productos', icon: BookOpen },
    { to: '/ventas', label: 'Registrar Venta', desc: 'Nueva venta de productos', icon: ShoppingCart },
    { to: '/contenido-digital', label: 'Contenido Digital', desc: 'Gestionar fotos de productos', icon: Image },
    { to: '/categorias', label: 'Categorías', desc: 'Organizar tipos de productos', icon: Tags },
  ];

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <header className="mb-8 sm:mb-12">
        <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
          Bienvenido, {user?.nombre}!
        </h1>
        <p className="text-muted-foreground">Panel de control de Inquieta Dulzura</p>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className={`transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg ${
              stat.alert ? 'border-l-4 border-l-amber-500' : ''
            }`}
          >
            <CardHeader className="flex flex-row items-center gap-4 px-5 pt-5">
              <div
                className={`flex size-12 items-center justify-center rounded-xl ${
                  stat.alert
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-brand-violet/10 text-brand-violet dark:bg-brand-violet/20'
                }`}
              >
                <stat.icon className="size-6" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground sm:mb-6 sm:text-2xl">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group/card rounded-xl bg-card p-5 text-card-foreground no-underline ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-brand-violet"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-violet/10 text-brand-violet transition-colors group-hover/card:bg-brand-violet group-hover/card:text-white dark:bg-brand-violet/20">
                <action.icon className="size-6" />
              </div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                {action.label}
              </h3>
              <p className="text-sm text-muted-foreground">{action.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
