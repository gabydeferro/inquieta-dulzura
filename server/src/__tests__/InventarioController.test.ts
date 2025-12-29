import { test, expect } from 'vitest';
import { getInventario } from '../controllers/InventarioController';
test('getInventario', async () => {
  const response = await getInventario({} as any, {} as any);
  expect(response).toBeInstanceOf(Array);
});