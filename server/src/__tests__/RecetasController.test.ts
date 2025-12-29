import { test, expect } from 'vitest';
import { getRecetas } from '../controllers/RecetasController';
test('getRecetas', async () => {
  const response = await getRecetas({} as any, {} as any);
  expect(response).toBeInstanceOf(Array);
});