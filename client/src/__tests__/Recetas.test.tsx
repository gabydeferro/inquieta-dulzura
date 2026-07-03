import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Recetas from '../Recetas';

// Mock Confirm context
const mockConfirm = vi.fn();
vi.mock('../contexts/ConfirmContext', () => ({
  useConfirm: () => mockConfirm,
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((_: number) => null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('Recetas Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanup();
  });

  const renderRecetas = () => render(<Recetas />);

  /** Wait for hardcoded mock data to render (Torta de Chocolate is the first recipe) */
  const waitForData = () =>
    waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    // ── Render ──────────────────────────────────────────────────

  it('renders recipe cards after loading', async () => {
    renderRecetas();
    await waitForData();
    expect(screen.getByText('Pan Integral')).toBeInTheDocument();
    expect(screen.getByText('Deliciosa torta de chocolate con cobertura')).toBeInTheDocument();
  });

  // ── Edit button ─────────────────────────────────────────────

  it('renders edit (Pencil) button on each recipe card', async () => {
    renderRecetas();
    await waitForData();

    const editButtons = screen.getAllByTitle('Editar');
    expect(editButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('opens dialog with "Editar Receta" title on edit click', async () => {
    const user = userEvent.setup();
    renderRecetas();
    await waitForData();

    const editButtons = screen.getAllByTitle('Editar');
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Editar Receta/i })).toBeInTheDocument();
    });
  });

  it('pre-fills form fields when editing a recipe', async () => {
    const user = userEvent.setup();
    renderRecetas();
    await waitForData();

    const editButtons = screen.getAllByTitle('Editar');
    await user.click(editButtons[0]);

    await waitFor(() => {
      const nombreInput = screen.getByDisplayValue('Torta de Chocolate');
      expect(nombreInput).toBeInTheDocument();
    });
  });

  it('pre-fills description, tiempo, porciones on edit', async () => {
    const user = userEvent.setup();
    renderRecetas();
    await waitForData();

    const editButtons = screen.getAllByTitle('Editar');
    await user.click(editButtons[0]);

    await waitFor(() => {
      // Descripción pre-filled
      expect(screen.getByDisplayValue('Deliciosa torta de chocolate con cobertura')).toBeInTheDocument();
      // tiempo_preparacion pre-filled
      expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    });
  });

  it('shows "Nueva Receta" title when creating (not editing)', async () => {
    const user = userEvent.setup();
    renderRecetas();
    await waitForData();

    await user.click(screen.getByRole('button', { name: /Nueva Receta/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Nueva Receta/i })).toBeInTheDocument();
    });
  });

  it('updates recipe in-place on edit save', async () => {
    const user = userEvent.setup();
    renderRecetas();
    await waitForData();

    // Click edit on first recipe
    const editButtons = screen.getAllByTitle('Editar');
    await user.click(editButtons[0]);

    // Change the name
    await waitFor(() => {
      expect(screen.getByDisplayValue('Torta de Chocolate')).toBeInTheDocument();
    });

    const nombreInput = screen.getByDisplayValue('Torta de Chocolate');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Torta de Chocolate Editada');

    // Save
    await user.click(screen.getByRole('button', { name: /Guardar Receta/i }));

    // Verify updated name appears on card
    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate Editada')).toBeInTheDocument();
    });
    // Original should no longer be present
    expect(screen.queryByText('Torta de Chocolate')).not.toBeInTheDocument();
  });

  it('resets editing state on dialog close', async () => {
    const user = userEvent.setup();
    renderRecetas();
    await waitForData();

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

  // ── localStorage persistence ────────────────────────────────

  it('persists recetas to localStorage on save', async () => {
    const user = userEvent.setup();
    renderRecetas();
    await waitForData();

    await user.click(screen.getByRole('button', { name: /Nueva Receta/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Nueva Receta/i })).toBeInTheDocument();
    });

    const nombreInput = screen.getByLabelText('Nombre *');
    await user.type(nombreInput, 'Test Recipe');

    await user.click(screen.getByRole('button', { name: /Guardar Receta/i }));

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    });

    // Verify localStorage was called (persistence on recetas change)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'inquieta-recetas',
      expect.any(String),
    );
  });

  it('loads recetas from localStorage on mount if available', async () => {
    const storedRecetas = JSON.stringify([
      {
        id: 99,
        nombre: 'Stored Recipe',
        descripcion: 'Loaded from localStorage',
        instrucciones: '',
        tiempo_preparacion: 30,
        porciones: 4,
        activo: true,
        ingredientes: [],
      },
    ]);
    localStorageMock.getItem.mockReturnValue(storedRecetas);

    renderRecetas();
    await waitFor(() => {
      expect(screen.getByText('Stored Recipe')).toBeInTheDocument();
    });
  });

  it('falls back to hardcoded data when localStorage is empty', async () => {
    renderRecetas();
    await waitForData();
    expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
  });
});
