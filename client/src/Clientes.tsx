import React, { useState, useEffect, useCallback, useRef } from 'react';
import api, { PaginatedResponse } from './services/api';
import { Cliente, ClienteForm } from './types/Cliente';
import { useNotification } from './contexts/NotificationContext';
import { useConfirm } from './contexts/ConfirmContext';
import { clienteCreateSchema, clienteUpdateSchema } from './schemas/cliente.schema';
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
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Users, Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const emptyForm: ClienteForm = {
  nombre: '',
  telefono: '',
  email: '',
  direccion: '',
  notas: '',
};

const PAGE_SIZE = 20;

const Clientes: React.FC = () => {
  const { showNotification } = useNotification();
  const confirm = useConfirm();

  const [data, setData] = useState<PaginatedResponse<Cliente> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<ClienteForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchClientes = useCallback(async (currentPage: number, query: string) => {
    setLoading(true);
    try {
      const response = await api.getClientes(query || undefined, currentPage, PAGE_SIZE);
      setData(response.data);
    } catch {
      showNotification('Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    void fetchClientes(page, search);
  }, [page, fetchClientes]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      void fetchClientes(1, value);
    }, 300);
  };

  const validateForm = (): boolean => {
    const schema = editingCliente ? clienteUpdateSchema : clienteCreateSchema;
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join('.');
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingCliente(null);
    setErrors({});
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      notas: cliente.notas || '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Clean up empty optional strings to undefined before sending
    const payload: ClienteForm = {
      nombre: formData.nombre,
      telefono: formData.telefono || undefined,
      email: formData.email || undefined,
      direccion: formData.direccion || undefined,
      notas: formData.notas || undefined,
    };

    try {
      if (editingCliente) {
        await api.updateCliente(editingCliente.id, payload);
        showNotification('Cliente actualizado con exito', 'success');
      } else {
        await api.createCliente(payload);
        showNotification('Cliente creado correctamente', 'success');
      }
      setShowModal(false);
      resetForm();
      void fetchClientes(page, search);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showNotification(err.response?.data?.message || 'Error al guardar el cliente', 'error');
    }
  };

  const handleDelete = async (cliente: Cliente) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Cliente',
      message: `Desea eliminar a "${cliente.nombre}"? Esta accion es reversible.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.deleteCliente(cliente.id);
      showNotification('Cliente eliminado', 'info');
      void fetchClientes(page, search);
    } catch {
      showNotification('Error al eliminar el cliente', 'error');
    }
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
            <Users className="size-7 sm:size-8 lg:size-9 text-brand-violet" />
            Clientes
          </h1>
          <p className="text-muted-foreground">Gestion de clientes registrados</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />+ Nuevo Cliente
        </Button>
      </header>

      {/* Search + Pagination Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o telefono..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {data && data.total > PAGE_SIZE && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Pagina {page} de {totalPages} ({data.total} clientes)
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
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
          Cargando clientes...
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 text-muted-foreground">
          <Users className="size-12 opacity-30" />
          <p>{search ? 'No se encontraron clientes con esa busqueda' : 'No hay clientes registrados'}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Telefono</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Direccion</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nombre}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {cliente.telefono || <span className="italic opacity-50">—</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {cliente.email || <span className="italic opacity-50">—</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {cliente.direccion || <span className="italic opacity-50">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(cliente)}
                        title="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => void handleDelete(cliente)}
                        title="Eliminar"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Bottom Pagination */}
      {data && data.total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-center gap-2">
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
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowModal(false);
            setErrors({});
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={(e) => void handleSubmit(e)} noValidate>
            <DialogHeader>
              <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData({ ...formData, nombre: e.target.value });
                    if (errors.nombre) setErrors({ ...errors, nombre: '' });
                  }}
                  className={errors.nombre ? 'border-destructive' : ''}
                  placeholder="Nombre completo"
                  required
                />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="11-1234-5678"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={errors.email ? 'border-destructive' : ''}
                    placeholder="cliente@email.com"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="direccion">Direccion</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Calle, numero, localidad"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notas">Notas</Label>
                <textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                  className="h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                  placeholder="Notas adicionales sobre el cliente..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setErrors({});
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">{editingCliente ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clientes;
