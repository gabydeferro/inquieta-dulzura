import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../services/AuthService';

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService();
    });

    describe('register', () => {
        it('debe registrar un nuevo usuario correctamente', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                nombre: 'Test User'
            };

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
                nombre: 'Test User'
            };

            // Primer registro
            await authService.register(userData);

            // Segundo registro con mismo email
            const result = await authService.register(userData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('email ya está registrado');
        });
    });

    describe('login', () => {
        it('debe autenticar usuario con credenciales válidas', async () => {
            // Primero registrar usuario
            const userData = {
                email: 'login@example.com',
                password: 'password123',
                nombre: 'Login User'
            };
            await authService.register(userData);

            // Luego intentar login
            const result = await authService.login({
                email: userData.email,
                password: userData.password
            });

            expect(result.success).toBe(true);
            expect(result.usuario).toBeDefined();
            expect(result.tokens).toBeDefined();
        });

        it('debe rechazar credenciales inválidas', async () => {
            const result = await authService.login({
                email: 'noexiste@example.com',
                password: 'wrongpassword'
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain('Credenciales inválidas');
        });
    });

    describe('verifyAccessToken', () => {
        it('debe verificar token válido', async () => {
            // Registrar y obtener token
            const userData = {
                email: 'token@example.com',
                password: 'password123',
                nombre: 'Token User'
            };
            const registerResult = await authService.register(userData);
            const token = registerResult.tokens!.accessToken;

            // Verificar token
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
