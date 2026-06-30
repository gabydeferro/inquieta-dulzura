import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../services/AuthService';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';

vi.mock('../config/database', () => ({
  pool: {
    execute: vi.fn(),
  },
}));
vi.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  const mockExecute = pool.execute as vi.Mock;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('debe registrar un nuevo usuario correctamente', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        nombre: 'Test User',
      };

      // 1. SELECT email check → no existing user
      mockExecute.mockResolvedValueOnce([[], []]);
      // bcrypt.hash mock
      (bcrypt.hash as vi.Mock).mockResolvedValueOnce('hashed_pass');
      // 2. INSERT usuario → insertId: 1
      mockExecute.mockResolvedValueOnce([{ insertId: 1 }, []]);
      // 3. SELECT user by id
      const mockUser = {
        id: 1,
        email: userData.email,
        nombre: userData.nombre,
        rol: 'usuario' as const,
        activo: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockExecute.mockResolvedValueOnce([[mockUser], []]);
      // 4. INSERT refresh_token (from generateTokens)
      mockExecute.mockResolvedValueOnce([{}, []]);

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.usuario).toBeDefined();
      expect(result.usuario?.email).toBe(userData.email);
      expect(result.tokens).toBeDefined();
    });

    it('debe rechazar email duplicado', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        nombre: 'Test User',
      };

      // First register: succeeds
      mockExecute.mockResolvedValueOnce([[], []]); // SELECT check
      (bcrypt.hash as vi.Mock).mockResolvedValueOnce('hashed_pass');
      mockExecute.mockResolvedValueOnce([{ insertId: 1 }, []]); // INSERT
      const mockUser = {
        id: 1,
        email: userData.email,
        nombre: userData.nombre,
        rol: 'usuario' as const,
        activo: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockExecute.mockResolvedValueOnce([[mockUser], []]); // SELECT user
      mockExecute.mockResolvedValueOnce([{}, []]); // INSERT refresh_token

      await authService.register(userData);

      // Second register: email already exists
      mockExecute.mockResolvedValueOnce([[{ id: 1 }], []]); // SELECT check → found!

      const result = await authService.register(userData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('email ya está registrado');
    });
  });

  describe('login', () => {
    it('debe autenticar usuario con credenciales válidas', async () => {
      const credentials = {
        email: 'login@example.com',
        password: 'password123',
      };

      // First register a user
      mockExecute.mockResolvedValueOnce([[], []]); // SELECT check
      (bcrypt.hash as vi.Mock).mockResolvedValueOnce('hashed_pass');
      mockExecute.mockResolvedValueOnce([{ insertId: 1 }, []]); // INSERT
      const mockUser = {
        id: 1,
        email: credentials.email,
        nombre: 'Login User',
        rol: 'usuario' as const,
        activo: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockExecute.mockResolvedValueOnce([[mockUser], []]); // SELECT user
      mockExecute.mockResolvedValueOnce([{}, []]); // INSERT refresh_token

      await authService.register({
        email: credentials.email,
        password: credentials.password,
        nombre: 'Login User',
      });

      // Now login
      // 1. SELECT user by email
      mockExecute.mockResolvedValueOnce([[{ ...mockUser, password_hash: 'hashed_pass' }], []]);
      // bcrypt.compare → true
      (bcrypt.compare as vi.Mock).mockResolvedValueOnce(true);
      // 2. UPDATE ultimo_login
      mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      // 3. INSERT refresh_token
      mockExecute.mockResolvedValueOnce([{}, []]);

      const result = await authService.login(credentials);

      expect(result.success).toBe(true);
      expect(result.usuario).toBeDefined();
      expect(result.tokens).toBeDefined();
    });

    it('debe rechazar credenciales inválidas', async () => {
      mockExecute.mockResolvedValueOnce([[], []]); // SELECT → no user found

      const result = await authService.login({
        email: 'noexiste@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Credenciales inválidas');
    });
  });

  describe('verifyAccessToken', () => {
    it('debe verificar token válido', async () => {
      const userData = {
        email: 'token@example.com',
        password: 'password123',
        nombre: 'Token User',
      };

      // Register to get a real JWT token
      mockExecute.mockResolvedValueOnce([[], []]); // SELECT check
      (bcrypt.hash as vi.Mock).mockResolvedValueOnce('hashed_pass');
      mockExecute.mockResolvedValueOnce([{ insertId: 1 }, []]); // INSERT
      const mockUser = {
        id: 1,
        email: userData.email,
        nombre: userData.nombre,
        rol: 'usuario' as const,
        activo: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockExecute.mockResolvedValueOnce([[mockUser], []]); // SELECT user
      mockExecute.mockResolvedValueOnce([{}, []]); // INSERT refresh_token

      const registerResult = await authService.register(userData);
      const token = registerResult.tokens!.accessToken;

      const payload = authService.verifyAccessToken(token);

      expect(payload).toBeDefined();
      expect(payload?.email).toBe(userData.email);
    });

    it('debe rechazar token inválido', () => {
      const payload = authService.verifyAccessToken('invalid-token');
      expect(payload).toBeNull();
    });
  });
});
