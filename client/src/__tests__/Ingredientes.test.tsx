import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
vi.mock('../components/Notification', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
}));

const mockConfirm = vi.fn();
vi.mock('../components/ConfirmModal', () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
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
      </BrowserRouter>
    );
  };

  const mockIngredientes: Ingrediente[] = [
    { id: 1, nombre: 'Harina', descripcion: 'Harina de trigo', unidad_medida: 'kg', costo_unitario: 1.2, activo: true },
    { id: 2, nombre: 'Azucar', descripcion: 'Azucar refinada', unidad_medida: 'kg', costo_unitario: 0.8, activo: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getIngredientes as vi.Mock).mockResolvedValue({ data: mockIngredientes });
  });

  it('should render the Ingredientes component and display ingredients', async () => {
    renderIngredientes();

    expect(screen.getByText(/Gestión de Ingredientes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agregar Ingrediente/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
      expect(screen.getByText('Azucar')).toBeInTheDocument();
      expect(screen.getByText('1.20')).toBeInTheDocument();
      expect(screen.getByText('0.80')).toBeInTheDocument();
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
    renderIngredientes();

    fireEvent.click(screen.getByRole('button', { name: /Agregar Ingrediente/i }));

    const nombreInput = screen.getByLabelText(/Nombre:/i);
    const unidadMedidaSelect = screen.getByLabelText(/Unidad de Medida:/i);
    const costoUnitarioInput = screen.getByLabelText(/Costo Unitario:/i);

    fireEvent.change(nombreInput, { target: { value: 'Leche' } });
    fireEvent.change(unidadMedidaSelect, { target: { value: 'litros' } });
    fireEvent.change(costoUnitarioInput, { target: { value: '1.5' } });

    (api.createIngrediente as vi.Mock).mockResolvedValueOnce({ data: { id: 3, nombre: 'Leche', unidad_medida: 'litros', costo_unitario: 1.5, activo: true } });
    (api.getIngredientes as vi.Mock).mockResolvedValueOnce({ data: [...mockIngredientes, { id: 3, nombre: 'Leche', unidad_medida: 'litros', costo_unitario: 1.5, activo: true }] });

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(api.createIngrediente).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Leche', unidad_medida: 'litros', costo_unitario: 1.5 }));
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
    renderIngredientes();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Editar/i })[0]);

    const nombreInput = screen.getByDisplayValue('Harina');
    fireEvent.change(nombreInput, { target: { value: 'Harina Integral' } });

    (api.updateIngrediente as vi.Mock).mockResolvedValueOnce({ data: { ...mockIngredientes[0], nombre: 'Harina Integral' } });
    (api.getIngredientes as vi.Mock).mockResolvedValueOnce({ data: [{ ...mockIngredientes[0], nombre: 'Harina Integral' }, mockIngredientes[1]] });

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(api.updateIngrediente).toHaveBeenCalledWith(1, expect.objectContaining({ nombre: 'Harina Integral' }));
      expect(mockShowNotification).toHaveBeenCalledWith('Ingrediente actualizado con éxito', 'success');
      expect(screen.getByText('Harina Integral')).toBeInTheDocument();
    });
  });

  it('should delete an ingredient', async () => {
    renderIngredientes();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
    });

    (mockConfirm as vi.Mock).mockResolvedValueOnce(true);
    (api.deleteIngrediente as vi.Mock).mockResolvedValueOnce({});
    (api.getIngredientes as vi.Mock).mockResolvedValueOnce({ data: [mockIngredientes[1]] });

    fireEvent.click(screen.getAllByRole('button', { name: /Eliminar/i })[0]);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(api.deleteIngrediente).toHaveBeenCalledWith(1);
      expect(mockShowNotification).toHaveBeenCalledWith('Ingrediente eliminado con éxito', 'success');
      expect(screen.queryByText('Harina')).not.toBeInTheDocument();
    });
  });

  it('should show error notification on API failure during fetch', async () => {
    (api.getIngredientes as vi.Mock).mockRejectedValueOnce(new Error('Network error'));
    renderIngredientes();

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Error al cargar ingredientes', 'error');
    });
  });

  it('should show error notification on API failure during create', async () => {
    renderIngredientes();

    fireEvent.click(screen.getByRole('button', { name: /Agregar Ingrediente/i }));

    const nombreInput = screen.getByLabelText(/Nombre:/i);
    fireEvent.change(nombreInput, { target: { value: 'Leche' } });
    (api.createIngrediente as vi.Mock).mockRejectedValueOnce(new Error('Creation failed'));

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Error al guardar ingrediente', 'error');
    });
  });

  it('should show error notification on API failure during update', async () => {
    renderIngredientes();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Editar/i })[0]);

    const nombreInput = screen.getByDisplayValue('Harina');
    fireEvent.change(nombreInput, { target: { value: 'Harina Edit Failed' } });
    (api.updateIngrediente as vi.Mock).mockRejectedValueOnce(new Error('Update failed'));

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Error al guardar ingrediente', 'error');
    });
  });

  it('should show error notification on API failure during delete', async () => {
    renderIngredientes();

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
    });

    (mockConfirm as vi.Mock).mockResolvedValueOnce(true);
    (api.deleteIngrediente as vi.Mock).mockRejectedValueOnce(new Error('Delete failed'));

    fireEvent.click(screen.getAllByRole('button', { name: /Eliminar/i })[0]);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Error al eliminar ingrediente', 'error');
    });
  });
});