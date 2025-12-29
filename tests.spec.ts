import { test, expect } from 'vitest';
import { getInventario } from '../services/InventarioService';
import { connection } from '../db';

test('getInventario', async () => {
  // Arrange
  const expectedRows = [{ id: 1, nombre: 'Producto 1', descripcion: 'Descripción 1' }];
  const mockExecute = jest.fn(() => Promise.resolve([expectedRows]));
  connection.execute = mockExecute;

  // Act
  const response = await getInventario();

  // Assert
  expect(response).toEqual(expectedRows);
  expect(mockExecute).toHaveBeenCalledTimes(1);
  expect(mockExecute).toHaveBeenCalledWith('SELECT * FROM inventario');
});

test('getInventario con error', async () => {
  // Arrange
  const mockExecute = jest.fn(() => Promise.reject(new Error('Error de conexión')));
  connection.execute = mockExecute;

  // Act & Assert
  await expect(getInventario()).rejects.toThrow('Error de conexión');
});

test('getInventario con resultado vacío', async () => {
  // Arrange
  const expectedRows = [];
  const mockExecute = jest.fn(() => Promise.resolve([expectedRows]));
  connection.execute = mockExecute;

  // Act
  const response = await getInventario();

  // Assert
  expect(response).toEqual(expectedRows);
});
