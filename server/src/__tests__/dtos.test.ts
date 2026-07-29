import { describe, it, expect } from 'vitest';
import type { CreateProduccionDTO, ProduccionResponse } from '../dtos/ProduccionDTO';
import type { IngredienteDTO } from '../dtos/IngredienteDTO';

describe('CreateProduccionDTO', () => {
  it('should accept a valid production input', () => {
    const input: CreateProduccionDTO = {
      receta_id: 1,
      cantidad_producir: 5,
    };
    expect(input.receta_id).toBe(1);
    expect(input.cantidad_producir).toBe(5);
  });
});

describe('ProduccionResponse', () => {
  it('should include id, receta data, producto data, cantidad and timestamps', () => {
    const response: ProduccionResponse = {
      id: 1,
      receta_id: 1,
      producto_id: 2,
      cantidad_producida: 5,
      tandas_ejecutadas: 10,
      created_at: new Date('2026-07-29'),
      nombre_receta: 'Masa base',
      nombre_producto: 'Pan de molde',
    };
    expect(response.id).toBe(1);
    expect(response.nombre_receta).toBe('Masa base');
    expect(response.tandas_ejecutadas).toBe(10);
  });

  it('should allow optional fields to be omitted', () => {
    const response: ProduccionResponse = {
      id: 2,
      receta_id: 3,
      producto_id: 4,
      cantidad_producida: 10,
      tandas_ejecutadas: 20,
      created_at: new Date(),
    };
    expect(response.ingredientes_consumidos).toBeUndefined();
    expect(response.created_by).toBeUndefined();
  });
});

describe('IngredienteDTO', () => {
  it('should include cantidad_disponible as optional field', () => {
    const ingrediente: IngredienteDTO = {
      nombre: 'Harina',
      unidad_medida: 'kg',
      cantidad_disponible: 50,
    };
    expect(ingrediente.cantidad_disponible).toBe(50);
  });

  it('should work without cantidad_disponible', () => {
    const ingrediente: IngredienteDTO = {
      nombre: 'Sal',
      unidad_medida: 'gramos',
    };
    expect(ingrediente.cantidad_disponible).toBeUndefined();
  });
});
