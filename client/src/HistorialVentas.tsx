import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api, { PaginatedResponse } from './services/api';
import { VentaHistorial } from './types/Venta';
import { Cliente } from './types/Cliente';
import { useNotification } from './contexts/NotificationContext';
import { useReducedMotion } from './lib/animations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { History, ChevronLeft, ChevronRight, X } from 'lucide-react';

const PAGE_SIZE = 20;

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'cuenta_dni', label: 'Cuenta DNI' },
  { value: 'modo', label: 'Modo' },
  { value: 'otro', label: 'Otro' },
];

interface Filters {
  fecha_desde: string;
  fecha_hasta: string;
  metodo_pago: string;
  cliente_id: string;
}

const emptyFilters: Filters = {
  fecha_desde: '',
  fecha_hasta: '',
  metodo_pago: '',
  cliente_id: '',
};

const HistorialVentas: React.FC = () => {
  const { showNotification } = useNotification();
  const { fadeUp, fadeIn } = useReducedMotion();

  const [data, setData] = useState<PaginatedResponse<VentaHistorial> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // Fetch clientes for dropdown
  useEffect(() => {
    void (async () => {
      try {
        const res = await api.getClientes(undefined, 1, 200);
        setClientes(res.data.data);
      } catch {
        // Silently fail — client filter just won't have options
      }
    })();
  }, []);

  const fetchHistorial = useCallback(
    async (currentPage: number, currentFilters: Filters) => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          page: currentPage,
          limit: PAGE_SIZE,
        };
        if (currentFilters.fecha_desde) params.fecha_desde = currentFilters.fecha_desde;
        if (currentFilters.fecha_hasta) params.fecha_hasta = currentFilters.fecha_hasta;
        if (currentFilters.metodo_pago) params.metodo_pago = currentFilters.metodo_pago;
        if (currentFilters.cliente_id) params.cliente_id = Number(currentFilters.cliente_id);

        const response = await api.getHistorialVentas(params);
        setData(response.data);
      } catch {
        showNotification('Error al cargar historial de ventas', 'error');
      } finally {
        setLoading(false);
      }
    },
    [showNotification],
  );

  useEffect(() => {
    void fetchHistorial(page, filters);
  }, [page, fetchHistorial]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPage(1);
    void fetchHistorial(1, newFilters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setPage(1);
    void fetchHistorial(1, emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const totalPages = data?.totalPages ?? 1;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.header
        className="mb-6"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
          <History className="size-7 sm:size-8 lg:size-9 text-brand-violet" />
          Historial de Ventas
        </h1>
        <p className="text-muted-foreground">Consulta y filtra el historial de ventas realizadas</p>
      </motion.header>

      {/* Filters */}
      <motion.div
        className="mb-4 rounded-lg border border-border/50 bg-card p-4"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Fecha desde</label>
            <Input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Fecha hasta</label>
            <Input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Metodo de pago</label>
            <Select
              value={filters.metodo_pago || 'all'}
              onValueChange={(v) => handleFilterChange('metodo_pago', v === 'all' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {METODOS_PAGO.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Cliente</label>
            <Select
              value={filters.cliente_id || 'all'}
              onValueChange={(v) => handleFilterChange('cliente_id', v === 'all' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="size-4" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </motion.div>

      {/* Pagination Controls (top) */}
      {data && data.total > PAGE_SIZE && (
        <motion.div
          className="mb-3 flex items-center justify-end gap-2 text-sm text-muted-foreground"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <span>
            Pagina {page} de {totalPages} ({data.total} ventas)
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </motion.div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
          Cargando historial...
        </div>
      ) : !data || data.data.length === 0 ? (
        <motion.div
          className="flex min-h-[30vh] flex-col items-center justify-center gap-2 text-muted-foreground"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <History className="size-12 opacity-30" />
          <p>
            {hasActiveFilters
              ? 'No se encontraron ventas con los filtros aplicados'
              : 'No hay ventas registradas'}
          </p>
        </motion.div>
      ) : (
        <div className="rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Productos</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="hidden sm:table-cell">Metodo Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((venta) => (
                <TableRow key={venta.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {formatDate(venta.fecha_venta)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {venta.cliente_nombre || <span className="italic opacity-50">Sin cliente</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-[300px] truncate">
                    {venta.productos || <span className="italic opacity-50">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {formatCurrency(venta.total)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell capitalize">
                    {venta.metodo_pago.replace('_', ' ')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Controls (bottom) */}
      {data && data.total > PAGE_SIZE && (
        <motion.div
          className="mt-4 flex items-center justify-center gap-2"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" /> Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente <ChevronRight className="size-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default HistorialVentas;
