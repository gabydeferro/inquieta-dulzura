import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfiguracionService } from '../services/ConfiguracionService';
import { pool } from '../config/database';

vi.mock('../config/database', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('ConfiguracionService', () => {
  let service: ConfiguracionService;
  const mockQuery = pool.query as vi.Mock;

  beforeEach(() => {
    service = new ConfiguracionService();
    mockQuery.mockReset();
  });

  describe('get', () => {
    it('should return the value when key exists', async () => {
      mockQuery.mockResolvedValueOnce([[{ clave: 'stock_bajo_threshold', valor: '15' }]]);

      const result = await service.get('stock_bajo_threshold');

      expect(result).toBe('15');
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT clave, valor FROM configuracion WHERE clave = ?',
        ['stock_bajo_threshold'],
      );
    });

    it('should return null when key does not exist', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await service.get('non_existent_key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should create a new key-value pair', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1, insertId: 1 }]);

      await service.set('new_setting', 'new_value');

      expect(mockQuery).toHaveBeenCalledWith(
        'INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
        ['new_setting', 'new_value'],
      );
    });

    it('should update an existing key-value pair', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 2, insertId: 0 }]);

      await service.set('stock_bajo_threshold', '20');

      expect(mockQuery).toHaveBeenCalledWith(
        'INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
        ['stock_bajo_threshold', '20'],
      );
    });
  });

  describe('getAll', () => {
    it('should return all settings', async () => {
      const mockRows = [
        { clave: 'stock_bajo_threshold', valor: '10' },
        { clave: 'business_name', valor: 'Inquieta Dulzura' },
        { clave: 'currency', valor: 'ARS' },
      ];
      mockQuery.mockResolvedValueOnce([mockRows]);

      const result = await service.getAll();

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockRows);
      expect(mockQuery).toHaveBeenCalledWith('SELECT clave, valor FROM configuracion');
    });

    it('should return empty array when no settings exist', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await service.getAll();

      expect(result).toEqual([]);
    });
  });
});
