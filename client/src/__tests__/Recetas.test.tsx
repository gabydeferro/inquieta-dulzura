import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Recetas from '../Recetas';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ConfirmProvider } from '../contexts/ConfirmContext';
import api from '../services/api';
import { RecetaDTO } from '../types/Receta';

// Mock the API service
vi.mock('../services/api', () => ({
  default: {
    getRecetas: vi.fn(),
    getRecetaById: vi.fn(),
    createReceta: vi.fn(),
    updateReceta: vi.fn(),
    deleteReceta: vi.fn(),
    getIngredientes: vi.fn(),
  },
}));

// Mock Notification context
const mockShowNotification = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Confirm context
const mockConfirm = vi.fn();
vi.mock('../contexts/ConfirmContext', () => ({
  useConfirm: () => mockConfirm,
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockRecetas: RecetaDTO[] = [
  {
    id: 1,
    nombre: 'Torta de Chocolate',
    descripcion: 'Deliciosa torta de chocolate con cobertura',
    instrucciones: '1. Precalentar\n2. Mezclar\n3. Hornear',
    tiempo_preparacion: 60,
    porciones: 8,
    activo: true,
    ingredientes: [
      {
        ingrediente_id: 1,
        cantidad: 300,
        unidad_medida: 'gramos' as const,
        ingrediente: {
          id: 1,
          nombre: 'Harina',
          unidad_medida: 'gramos',
          costo_unitario: 1.2,
          activo: true,
        },
      },
      {
        ingrediente_id: 2,
        cantidad: 200,
        unidad_medida: 'gramos' as const,
        ingrediente: {
          id: 2,
          nombre: 'Azúcar',
          unidad_medida: 'gramos',
          costo_unitario: 0.8,
          activo: true,
        },
      },
    ],
  },
  {
    id: 2,
    nombre: 'Pan Integral',
    descripcion: 'Pan artesanal integral',
    instrucciones: '1. Mezclar\n2. Amasar\n3. Reposar\n4. Hornear',
    tiempo_preparacion: 120,
    porciones: 12,
    activo: true,
    ingredientes: [
      {
        ingrediente_id: 3,
        cantidad: 500,
        unidad_medida: 'gramos' as const,
        ingrediente: {
          id: 3,
          nombre: 'Harina Integral',
          unidad_medida: 'gramos',
          costo_unitario: 0.9,
          activo: true,
        },
      },
    ],
  },
];

const mockIngredientes = [
  { id: 1, nombre: 'Harina', unidad_medida: 'gramos', costo_unitario: 1.2, activo: true },
  { id: 2, nombre: 'Azúcar', unidad_medida: 'gramos', costo_unitario: 0.8, activo: true },
  { id: 3, nombre: 'Harina Integral', unidad_medida: 'gramos', costo_unitario: 0.9, activo: true },
];

describe('Recetas Component', () => {
  const renderRecetas = () => {
    return render(
      <BrowserRouter>
        <NotificationProvider>
          <ConfirmProvider>
            <Recetas />
          </ConfirmProvider>
        </NotificationProvider>
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getRecetas).mockResolvedValue({ data: mockRecetas } as never);
    vi.mocked(api.getIngredientes).mockResolvedValue({ data: mockIngredientes } as never);
  });

  // ── Render & Load ────────────────────────────────────────────

  it('renders recipe cards after loading', async () => {
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    expect(screen.getByText('Pan Integral')).toBeInTheDocument();
    expect(screen.getByText('Deliciosa torta de chocolate con cobertura')).toBeInTheDocument();
  });

  it('shows loading state while fetching', async () => {
    // Don't resolve the promise yet
    vi.mocked(api.getRecetas).mockImplementationOnce(() => new Promise(() => {}));

    renderRecetas();

    expect(screen.getByText('Cargando recetas...')).toBeInTheDocument();
  });

  it('shows empty state when no recetas exist', async () => {
    vi.mocked(api.getRecetas).mockResolvedValueOnce({ data: [] } as never);

    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('No hay recetas disponibles')).toBeInTheDocument();
    });
  });

  it('shows error notification on fetch failure', async () => {
    vi.mocked(api.getRecetas).mockRejectedValueOnce(new Error('Network error'));

    renderRecetas();

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Error al cargar recetas', 'error');
    });
  });

  // ── Card actions ─────────────────────────────────────────────

  it('renders edit (Pencil) button on each recipe card', async () => {
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Editar');
    expect(editButtons.length).toBeGreaterThanOrEqual(1);
  });

  // ── Edit Dialog ──────────────────────────────────────────────

  it('opens dialog with "Editar Receta" title on edit click', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Editar');
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Editar Receta/i })).toBeInTheDocument();
    });
  });

  it('pre-fills form fields when editing a recipe', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Editar');
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Torta de Chocolate')).toBeInTheDocument();
    });
  });

  it('pre-fills description, tiempo, porciones on edit', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Editar');
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Deliciosa torta de chocolate con cobertura'),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    });
  });

  it('shows "Nueva Receta" title when creating (not editing)', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva Receta/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Nueva Receta/i })).toBeInTheDocument();
    });
  });

  // ── Create ───────────────────────────────────────────────────

  it('creates a new recipe via API', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva Receta/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Nueva Receta/i })).toBeInTheDocument();
    });

    const nombreInput = screen.getByLabelText('Nombre *');
    await user.type(nombreInput, 'Nueva Receta Test');

    // Fill required description
    const descInput = screen.getByLabelText('Descripción *');
    await user.type(descInput, 'Descripción de prueba');

    // Fill tiempo and porciones
    const tiempoInput = screen.getByLabelText('Tiempo de Preparación (min)');
    await user.clear(tiempoInput);
    await user.type(tiempoInput, '30');

    const porcionesInput = screen.getByLabelText('Porciones');
    await user.clear(porcionesInput);
    await user.type(porcionesInput, '4');

    vi.mocked(api.createReceta).mockResolvedValueOnce({
      data: {
        id: 3,
        nombre: 'Nueva Receta Test',
        descripcion: 'Descripción de prueba',
        tiempo_preparacion: 30,
        porciones: 4,
        activo: true,
      },
    } as never);
    vi.mocked(api.getRecetas).mockResolvedValueOnce({
      data: [
        ...mockRecetas,
        {
          id: 3,
          nombre: 'Nueva Receta Test',
          descripcion: 'Descripción de prueba',
          tiempo_preparacion: 30,
          porciones: 4,
          activo: true,
        },
      ],
    } as never);

    await user.click(screen.getByRole('button', { name: /Guardar Receta/i }));

    await waitFor(() => {
      expect(api.createReceta).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Nueva Receta Test',
          descripcion: 'Descripción de prueba',
        }),
      );
      expect(mockShowNotification).toHaveBeenCalledWith('Receta creada con éxito', 'success');
      expect(screen.getByText('Nueva Receta Test')).toBeInTheDocument();
    });
  });

  it('shows error notification on create failure', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva Receta/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Nueva Receta/i })).toBeInTheDocument();
    });

    const nombreInput = screen.getByLabelText('Nombre *');
    await user.type(nombreInput, 'Fail Recipe');
    const descInput = screen.getByLabelText('Descripción *');
    await user.type(descInput, 'Should fail');
    const tiempoInput = screen.getByLabelText('Tiempo de Preparación (min)');
    await user.clear(tiempoInput);
    await user.type(tiempoInput, '30');
    const porcionesInput = screen.getByLabelText('Porciones');
    await user.clear(porcionesInput);
    await user.type(porcionesInput, '4');

    vi.mocked(api.createReceta).mockRejectedValueOnce(new Error('Creation failed'));

    await user.click(screen.getByRole('button', { name: /Guardar Receta/i }));

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Error al guardar receta', 'error');
    });
  });

  // ── Update ───────────────────────────────────────────────────

  it('updates recipe via API on edit save', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Editar');
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Torta de Chocolate')).toBeInTheDocument();
    });

    const nombreInput = screen.getByDisplayValue('Torta de Chocolate');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Torta de Chocolate Editada');

    vi.mocked(api.updateReceta).mockResolvedValueOnce({
      data: { ...mockRecetas[0], nombre: 'Torta de Chocolate Editada' },
    } as never);
    vi.mocked(api.getRecetas).mockResolvedValueOnce({
      data: [{ ...mockRecetas[0], nombre: 'Torta de Chocolate Editada' }, mockRecetas[1]],
    } as never);

    await user.click(screen.getByRole('button', { name: /Guardar Receta/i }));

    await waitFor(() => {
      expect(api.updateReceta).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ nombre: 'Torta de Chocolate Editada' }),
      );
      expect(mockShowNotification).toHaveBeenCalledWith('Receta actualizada con éxito', 'success');
      expect(screen.getByText('Torta de Chocolate Editada')).toBeInTheDocument();
    });
  });

  it('shows error notification on update failure', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Editar');
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Torta de Chocolate')).toBeInTheDocument();
    });

    const nombreInput = screen.getByDisplayValue('Torta de Chocolate');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Torta Edit Fail');
    vi.mocked(api.updateReceta).mockRejectedValueOnce(new Error('Update failed'));

    await user.click(screen.getByRole('button', { name: /Guardar Receta/i }));

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Error al guardar receta', 'error');
    });
  });

  it('resets editing state on dialog close', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    // Open edit
    const editButtons = screen.getAllByTitle('Editar');
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Editar Receta/i })).toBeInTheDocument();
    });

    // Cancel
    await user.click(screen.getByRole('button', { name: /Cancelar/i }));

    // Re-open as NEW receta
    await user.click(screen.getByRole('button', { name: /Nueva Receta/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Nueva Receta/i })).toBeInTheDocument();
    });
    // Form should be empty (not pre-filled with old data)
    const nombreInput = screen.getByLabelText('Nombre *');
    expect(nombreInput).toHaveValue('');
  });

  // ── Delete ───────────────────────────────────────────────────

  it('deletes a recipe via API on confirm', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    vi.mocked(mockConfirm).mockResolvedValueOnce(true);
    vi.mocked(api.deleteReceta).mockResolvedValueOnce({} as never);
    vi.mocked(api.getRecetas).mockResolvedValueOnce({ data: [mockRecetas[1]] } as never);

    await user.click(screen.getAllByTitle('Eliminar')[0]);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(api.deleteReceta).toHaveBeenCalledWith(1);
      expect(mockShowNotification).toHaveBeenCalledWith('Receta eliminada con éxito', 'success');
      expect(screen.queryByText('Torta de Chocolate')).not.toBeInTheDocument();
    });
  });

  it('does not delete when confirm is cancelled', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    vi.mocked(mockConfirm).mockResolvedValueOnce(false);

    await user.click(screen.getAllByTitle('Eliminar')[0]);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(api.deleteReceta).not.toHaveBeenCalled();
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });
  });

  it('shows error notification on delete failure', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    vi.mocked(mockConfirm).mockResolvedValueOnce(true);
    vi.mocked(api.deleteReceta).mockRejectedValueOnce(new Error('Delete failed'));

    await user.click(screen.getAllByTitle('Eliminar')[0]);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Error al eliminar receta', 'error');
    });
  });

  // ── Detail Dialog ────────────────────────────────────────────

  it('opens detail dialog on Ver Detalle click', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    await user.click(screen.getAllByText('Ver Detalle')[0]);

    await waitFor(() => {
      // Header title inside the dialog has "Torta de Chocolate" text
      expect(screen.getByRole('heading', { name: /Torta de Chocolate/i })).toBeInTheDocument();
      // Detail section heading
      expect(screen.getAllByText('Descripción').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Validation ───────────────────────────────────────────────

  it('shows validation error when nombre is empty', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva Receta/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Nueva Receta/i })).toBeInTheDocument();
    });

    // Leave nombre empty, submit
    await user.click(screen.getByRole('button', { name: /Guardar Receta/i }));

    await waitFor(() => {
      expect(screen.getByText('Nombre debe tener al menos 2 caracteres')).toBeInTheDocument();
    });
    expect(api.createReceta).not.toHaveBeenCalled();
  });

  it('shows validation error when descripcion is empty', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva Receta/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Nueva Receta/i })).toBeInTheDocument();
    });

    // Fill nombre but leave descripcion empty
    const nombreInput = screen.getByLabelText('Nombre *');
    await user.type(nombreInput, 'Test Recipe');

    await user.click(screen.getByRole('button', { name: /Guardar Receta/i }));

    await waitFor(() => {
      expect(screen.getByText('Descripción es requerida')).toBeInTheDocument();
    });
    expect(api.createReceta).not.toHaveBeenCalled();
  });

  it('shows validation error when tiempo_preparacion is zero', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva Receta/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Nueva Receta/i })).toBeInTheDocument();
    });

    const nombreInput = screen.getByLabelText('Nombre *');
    await user.type(nombreInput, 'Test Recipe');
    const descInput = screen.getByLabelText('Descripción *');
    await user.type(descInput, 'Test desc');

    // Set porciones to a valid value to isolate the tiempo error
    const porcionesInput = screen.getByLabelText('Porciones');
    await user.clear(porcionesInput);
    await user.type(porcionesInput, '4');

    // Leave tiempo as 0 (default)
    await user.click(screen.getByRole('button', { name: /Guardar Receta/i }));

    await waitFor(() => {
      const errorElements = screen.getAllByText('Debe ser un número positivo');
      expect(errorElements.length).toBe(1);
    });
    expect(api.createReceta).not.toHaveBeenCalled();
  });

  it('shows validation error when porciones is zero', async () => {
    const user = userEvent.setup();
    renderRecetas();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva Receta/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Nueva Receta/i })).toBeInTheDocument();
    });

    const nombreInput = screen.getByLabelText('Nombre *');
    await user.type(nombreInput, 'Test Recipe');
    const descInput = screen.getByLabelText('Descripción *');
    await user.type(descInput, 'Test desc');

    // Set tiempo to valid value
    const tiempoInput = screen.getByLabelText('Tiempo de Preparación (min)');
    await user.clear(tiempoInput);
    await user.type(tiempoInput, '30');

    // Leave porciones as 0 (default)
    await user.click(screen.getByRole('button', { name: /Guardar Receta/i }));

    await waitFor(() => {
      expect(screen.getByText('Debe ser un número positivo')).toBeInTheDocument();
    });
    expect(api.createReceta).not.toHaveBeenCalled();
  });
});
