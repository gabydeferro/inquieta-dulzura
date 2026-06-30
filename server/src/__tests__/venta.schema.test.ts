import { describe, it, expect } from 'vitest';
import { ventaCreateSchema } from '../schemas/venta.schema';

describe('ventaCreateSchema', () => {
  it('should accept valid input with efectivo and one producto', () => {
    const result = ventaCreateSchema.safeParse({
      metodo_pago: 'efectivo',
      productos: [
        { producto_id: 1, cantidad: 2, precio_unitario: 25, subtotal: 50 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metodo_pago).toBe('efectivo');
      expect(result.data.productos).toHaveLength(1);
    }
  });

  it('should reject empty productos array', () => {
    const result = ventaCreateSchema.safeParse({
      metodo_pago: 'efectivo',
      productos: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('Agrega al menos'))).toBe(true);
    }
  });

  it('should reject invalid metodo_pago', () => {
    const result = ventaCreateSchema.safeParse({
      metodo_pago: 'bitcoin',
      productos: [
        { producto_id: 1, cantidad: 1, precio_unitario: 10, subtotal: 10 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('should default descuento to 0 when omitted', () => {
    const result = ventaCreateSchema.safeParse({
      metodo_pago: 'transferencia',
      productos: [
        { producto_id: 1, cantidad: 1, precio_unitario: 5, subtotal: 5 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.descuento).toBe(0);
    }
  });

  it('should accept optional cliente_id and descuento', () => {
    const result = ventaCreateSchema.safeParse({
      cliente_id: 3,
      metodo_pago: 'tarjeta',
      descuento: 10,
      productos: [
        { producto_id: 2, cantidad: 3, precio_unitario: 15, subtotal: 45 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cliente_id).toBe(3);
      expect(result.data.descuento).toBe(10);
    }
  });
});
