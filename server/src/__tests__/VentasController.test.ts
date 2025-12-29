import { test, expect } from 'vitest';
import { getVentas } from '../controllers/VentasController';
test('getVentas', async () => {
  const response = await getVentas({} as any, {} as any);
  expect(response).toBeInstanceOf(Array);
});