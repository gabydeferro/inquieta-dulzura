import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useReducedMotion } from '../lib/animations';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  DollarSign,
  AlertTriangle,
  ClipboardList,
  BookOpen,
  ShoppingCart,
  Image,
  Tags,
  Users,
  TrendingUp,
  ShoppingBag,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardStats {
  ventasHoy: { cantidad: number; total: number };
  ventasSemana: { cantidad: number; total: number };
  ventasMes: { cantidad: number; total: number };
  ingresosMes: number;
  totalIngresos: number;
  totalVentas: number;
  totalClientes: number;
  productosActivos: number;
  categoriasCount: number;
  ingredientesCount: number;
  recetasCount: number;
  ventasPorDia: Array<{ fecha: string; cantidad: number; total: number }>;
  metodosPago: Array<{ metodo: string; cantidad: number; total: number }>;
  topProductos: Array<{
    producto_id: number;
    nombre: string;
    cantidad: number;
    total: number;
  }>;
  stockBajo: Array<{
    producto_id: number;
    nombre: string;
    cantidad_disponible: number;
    unidad_medida: string;
  }>;
  stockBajoCount: number;
  partial_failures: string[];
}

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { fadeUp, staggerContainer } = useReducedMotion();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      const response = await api.getDashboardStats<DashboardStats>();
      setStats(response.data);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('Error al cargar datos del dashboard');
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

  if (error || !stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-destructive">
        {error || 'Error al cargar datos'}
      </div>
    );
  }

  const statCards = [
    {
      label: 'Ventas Hoy',
      value: stats.ventasHoy.cantidad,
      subtitle: `$${stats.ventasHoy.total.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      label: 'Ventas Semana',
      value: stats.ventasSemana.cantidad,
      subtitle: `$${stats.ventasSemana.total.toLocaleString()}`,
      icon: Calendar,
    },
    {
      label: 'Ventas Mes',
      value: stats.ventasMes.cantidad,
      subtitle: `$${stats.ingresosMes.toLocaleString()}`,
      icon: TrendingUp,
    },
    {
      label: 'Ingresos Totales',
      value: `$${stats.totalIngresos.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      label: 'Total Ventas',
      value: stats.totalVentas,
      icon: ShoppingBag,
    },
    {
      label: 'Clientes',
      value: stats.totalClientes,
      icon: Users,
    },
    {
      label: 'Productos Activos',
      value: stats.productosActivos,
      icon: Package,
    },
    {
      label: 'Stock Bajo',
      value: stats.stockBajoCount,
      icon: AlertTriangle,
      alert: true,
    },
  ];

  const quickActions = [
    {
      to: '/inventario',
      label: 'Gestionar Inventario',
      desc: 'Ver y actualizar productos',
      icon: ClipboardList,
    },
    {
      to: '/recetas',
      label: 'Ver Recetas',
      desc: 'Consultar recetas de productos',
      icon: BookOpen,
    },
    {
      to: '/ventas',
      label: 'Registrar Venta',
      desc: 'Nueva venta de productos',
      icon: ShoppingCart,
    },
    {
      to: '/contenido-digital',
      label: 'Contenido Digital',
      desc: 'Gestionar fotos de productos',
      icon: Image,
    },
    { to: '/categorias', label: 'Categorías', desc: 'Organizar tipos de productos', icon: Tags },
  ];

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <motion.header
        className="mb-8 sm:mb-12"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
          Bienvenido, {user?.nombre}!
        </h1>
        <p className="text-muted-foreground">Panel de control de Inquieta Dulzura</p>
      </motion.header>

      {/* KPI Cards Grid */}
      <motion.div
        className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {statCards.map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <Card
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
                  {stat.subtitle && (
                    <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
                  )}
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tendencia de Ventas (30 días)</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.ventasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="fecha"
                    className="text-xs"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'total' ? `$${value.toLocaleString()}` : value,
                      name === 'total' ? 'Total' : 'Cantidad',
                    ]}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString('es-AR');
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cantidad"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.2}
                    name="cantidad"
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.2}
                    name="total"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Payment Methods Chart */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Métodos de Pago</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.metodosPago}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ metodo, percent }) =>
                      `${metodo} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="metodo"
                  >
                    {stats.metodosPago.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products Table */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top 5 Productos (30 días)</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-2">Producto</th>
                    <th className="pb-2 text-right">Cantidad</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topProductos.map((producto) => (
                    <tr key={producto.producto_id} className="border-b last:border-0">
                      <td className="py-3 text-sm font-medium">{producto.nombre}</td>
                      <td className="py-3 text-right text-sm">{producto.cantidad}</td>
                      <td className="py-3 text-right text-sm">
                        ${producto.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {stats.topProductos.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-center text-sm text-muted-foreground">
                        No hay datos de ventas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* Stock Alerts */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alertas de Stock Bajo</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
              {stats.stockBajo.length > 0 ? (
                <ul className="space-y-3">
                  {stats.stockBajo.map((producto) => (
                    <li
                      key={producto.producto_id}
                      className="flex items-center justify-between rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20"
                    >
                      <div>
                        <p className="text-sm font-medium">{producto.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {producto.unidad_medida}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-amber-600">
                        {producto.cantidad_disponible}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  No hay productos con stock bajo
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions Section */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground sm:mb-6 sm:text-2xl">
          Accesos Rápidos
        </h2>
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {quickActions.map((action) => (
            <motion.div key={action.to} variants={fadeUp}>
              <Link
                to={action.to}
                className="group/card rounded-xl bg-card p-5 text-card-foreground no-underline ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-brand-violet"
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-violet/10 text-brand-violet transition-colors group-hover/card:bg-brand-violet group-hover/card:text-white dark:bg-brand-violet/20">
                  <action.icon className="size-6" />
                </div>
                <h3 className="mb-1 text-base font-semibold text-foreground">{action.label}</h3>
                <p className="text-sm text-muted-foreground">{action.desc}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
};

export default Dashboard;
