import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Ingredientes from '../Ingredientes';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ConfirmProvider } from '../contexts/ConfirmContext';
import api from '../services/api';
import { Ingrediente } from '../types/Ingrediente';

// Mock the API service
vi.mock('../services/api', () => ({
  default: {
    getIngredientes: vi.fn(),
    getIngredienteById: vi.fn(),
    createIngrediente: vi.fn(),
    updateIngrediente: vi.fn(),
    deleteIngrediente: vi.fn(),
  },
}));

// Mock Notification and Confirm contexts
const mockShowNotification = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockConfirm = vi.fn();
vi.mock('../contexts/ConfirmContext', () => ({
  useConfirm: () => mockConfirm,
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Ingredientes Component', () => {
  const renderIngredientes = () => {
    return render(
      <BrowserRouter>
        <NotificationProvider>
          <ConfirmProvider>
            <Ingredientes />
          </ConfirmProvider>
        </NotificationProvider>
      </BrowserRouter>,
    );
  };

  const mockIngredientes: Ingrediente[] = [
    {
      id: 1,
      nombre: 'Harina',
      descripcion: 'Harina de trigo',
      unidad_medida: 'kg',
      costo_unitario: 1.2,
      activo: true,
    },
    {
      id: 2,
      nombre: 'Azucar',
      descripcion: 'Azucar refinada',
      unidad_medida: 'kg',
      costo_unitario: 0.8,
      activo: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getIngredientes).mockResolvedValue({ data: mockIngredientes } as never);
  });

  it('should render the Ingredientes component and display ingredients', async () => {
    renderIngredientes();

    expect(screen.getByText(/Gestión de Ingredientes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agregar Ingrediente/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
      expect(screen.getByText('Azucar')).toBeInTheDocument();
      expect(screen.getByText('$1.20')).toBeInTheDocument();
      expect(screen.getByText('$0.80')).toBeInTheDocument();
    });
  });

  it('should open and close the create ingrediente modal', async () => {
    renderIngredientes();

    fireEvent.click(screen.getByRole('button', { name: /Agregar Ingrediente/i }));

    expect(screen.getByText(/Crear Ingrediente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Crear Ingrediente/i)).not.toBeInTheDocument();
    });
  });

  it('should create a new ingredient', async () => {
    const user = userEvent.setup();
    renderIngredientes();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Agregar Ingrediente/i }));

    await waitFor(() => {
      expect(screen.getByText(/Crear Ingrediente/i)).toBeInTheDocument();
    });

    const nombreInput = screen.getByLabelText(/Nombre:/i);
    const unidadMedidaSelect = screen.getByLabelText(/Unidad de Medida:/i);
    const costoUnitarioInput = screen.getByLabelText(/Costo Unitario:/i);

    await user.clear(nombreInput);
    await user.type(nombreInput, 'Leche');
    await user.selectOptions(unidadMedidaSelect, 'litros');
    await user.clear(costoUnitarioInput);
    await user.type(costoUnitarioInput, '1.5');

    vi.mocked(api.createIngrediente).mockResolvedValueOnce({
      data: { id: 3, nombre: 'Leche', unidad_medida: 'litros', costo_unitario: 1.5, activo: true },
    } as never);
    vi.mocked(api.getIngredientes).mockResolvedValueOnce({
      data: [
        ...mockIngredientes,
        { id: 3, nombre: 'Leche', unidad_medida: 'litros', costo_unitario: 1.5, activo: true },
      ],
    } as never);

    await user.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(api.createIngrediente).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Leche', unidad_medida: 'litros', costo_unitario: 1.5 }),
      );
      expect(mockShowNotification).toHaveBeenCalledWith('Ingrediente creado con éxito', 'success');
      expect(screen.getByText('Leche')).toBeInTheDocument();
    });
  });

  it('should open and close the edit ingrediente modal', async () => {
    renderIngredientes();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Editar/i })[0]);

    expect(screen.getByText(/Editar Ingrediente/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Harina')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Editar Ingrediente/i)).not.toBeInTheDocument();
    });
  });

  it('should update an existing ingredient', async () => {
    const user = userEvent.setup();
    renderIngredientes();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: /Editar/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Editar Ingrediente/i)).toBeInTheDocument();
    });

    const nombreInput = screen.getByDisplayValue('Harina');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Harina Integral');

    vi.mocked(api.updateIngrediente).mockResolvedValueOnce({
      data: { ...mockIngredientes[0], nombre: 'Harina Integral' },
    } as never);
    vi.mocked(api.getIngredientes).mockResolvedValueOnce({
      data: [{ ...mockIngredientes[0], nombre: 'Harina Integral' }, mockIngredientes[1]],
    } as never);

    await user.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(api.updateIngrediente).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ nombre: 'Harina Integral' }),
      );
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Ingrediente actualizado con éxito',
        'success',
      );
      expect(screen.getByText('Harina Integral')).toBeInTheDocument();
    });
  });

  it('should delete an ingredient', async () => {
    const user = userEvent.setup();
    renderIngredientes();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
    });

    vi.mocked(mockConfirm).mockResolvedValueOnce(true);
    vi.mocked(api.deleteIngrediente).mockResolvedValueOnce({} as never);
    vi.mocked(api.getIngredientes).mockResolvedValueOnce({ data: [mockIngredientes[1]] } as never);

    await user.click(screen.getAllByRole('button', { name: /Eliminar/i })[0]);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(api.deleteIngrediente).toHaveBeenCalledWith(1);
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Ingrediente eliminado con éxito',
        'success',
      );
      expect(screen.queryByText('Harina')).not.toBeInTheDocument();
    });
  });

  it('should show error notification on API failure during fetch', async () => {
    vi.mocked(api.getIngredientes).mockRejectedValueOnce(new Error('Network error'));
    renderIngredientes();

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Error al cargar ingredientes', 'error');
    });
  });

  it('should show error notification on API failure during create', async () => {
    const user = userEvent.setup();
    renderIngredientes();

    await user.click(screen.getByRole('button', { name: /Agregar Ingrediente/i }));

    await waitFor(() => {
      expect(screen.getByText(/Crear Ingrediente/i)).toBeInTheDocument();
    });

    const nombreInput = screen.getByLabelText(/Nombre:/i);
    const costoUnitarioInput = screen.getByLabelText(/Costo Unitario:/i);
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Leche');
    await user.clear(costoUnitarioInput);
    await user.type(costoUnitarioInput, '1.5');
    vi.mocked(api.createIngrediente).mockRejectedValueOnce(new Error('Creation failed'));

    await user.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Error al guardar ingrediente', 'error');
    });
  });

  it('should show error notification on API failure during update', async () => {
    const user = userEvent.setup();
    renderIngredientes();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: /Editar/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Editar Ingrediente/i)).toBeInTheDocument();
    });

    const nombreInput = screen.getByDisplayValue('Harina');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Harina Edit Failed');
    vi.mocked(api.updateIngrediente).mockRejectedValueOnce(new Error('Update failed'));

    await user.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Error al guardar ingrediente', 'error');
    });
  });

  it('should show error notification on API failure during delete', async () => {
    const user = userEvent.setup();
    renderIngredientes();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
    });

    vi.mocked(mockConfirm).mockResolvedValueOnce(true);
    vi.mocked(api.deleteIngrediente).mockRejectedValueOnce(new Error('Delete failed'));

    await user.click(screen.getAllByRole('button', { name: /Eliminar/i })[0]);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Error al eliminar ingrediente', 'error');
    });
  });

  // ── Client Validation Tests (RED) ──────────────────────────────────

  it('should show validation error when nombre is empty on create', async () => {
    const user = userEvent.setup();
    renderIngredientes();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Agregar Ingrediente/i }));

    await waitFor(() => {
      expect(screen.getByText(/Crear Ingrediente/i)).toBeInTheDocument();
    });

    // Leave nombre empty, fill only other fields
    const unidadMedidaSelect = screen.getByLabelText(/Unidad de Medida:/i);
    const costoUnitarioInput = screen.getByLabelText(/Costo Unitario:/i);
    await user.selectOptions(unidadMedidaSelect, 'litros');
    await user.clear(costoUnitarioInput);
    await user.type(costoUnitarioInput, '1.5');

    await user.click(screen.getByRole('button', { name: /Guardar/i }));

    // Expect validation error, NOT API call
    await waitFor(() => {
      expect(screen.getByText('Nombre is required')).toBeInTheDocument();
    });
    expect(api.createIngrediente).not.toHaveBeenCalled();
  });

  it('should show validation error when costo_unitario is negative', async () => {
    const user = userEvent.setup();
    renderIngredientes();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Agregar Ingrediente/i }));

    await waitFor(() => {
      expect(screen.getByText(/Crear Ingrediente/i)).toBeInTheDocument();
    });

    const nombreInput = screen.getByLabelText(/Nombre:/i);
    const costoUnitarioInput = screen.getByLabelText(/Costo Unitario:/i);
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Leche');

    // Use fireEvent.change for number input to avoid React-controlled input issues
    await user.clear(costoUnitarioInput);
    fireEvent.change(costoUnitarioInput, { target: { name: 'costo_unitario', value: '-5' } });

    await user.click(screen.getByRole('button', { name: /Guardar/i }));

    // Expect validation error, NOT API call
    await waitFor(() => {
      expect(screen.getByText('Costo unitario must be positive')).toBeInTheDocument();
    });
    expect(api.createIngrediente).not.toHaveBeenCalled();
  });

  it('should show validation error when nombre is empty on edit', async () => {
    const user = userEvent.setup();
    renderIngredientes();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: /Editar/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Editar Ingrediente/i)).toBeInTheDocument();
    });

    const nombreInput = screen.getByDisplayValue('Harina');
    await user.clear(nombreInput);

    await user.click(screen.getByRole('button', { name: /Guardar/i }));

    // Expect validation error, NOT API call
    await waitFor(() => {
      expect(screen.getByText('Nombre is required')).toBeInTheDocument();
    });
    expect(api.updateIngrediente).not.toHaveBeenCalled();
  });
});
