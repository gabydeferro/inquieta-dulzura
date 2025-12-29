import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

export class AuthController {
    /**
     * POST /api/auth/register
     * Registrar nuevo usuario
     */
    async register(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { email, password, nombre } = req.body;

            // Validar campos
            if (!email || !password || !nombre) {
                res.status(400).json({
                    success: false,
                    message: 'Email, contraseña y nombre son requeridos'
                });
                return;
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({
                    success: false,
                    message: 'Formato de email inválido'
                });
                return;
            }

            // Validar longitud de contraseña
            if (password.length < 6) {
                res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
                return;
            }

            const resultado = await authService.register({ email, password, nombre });

            res.status(resultado.success ? 201 : 400).json(resultado);

        } catch (error) {
            console.error('Error en register:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * POST /api/auth/login
     * Iniciar sesión
     */
    async login(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Email y contraseña son requeridos'
                });
                return;
            }

            const resultado = await authService.login({ email, password });

            res.status(resultado.success ? 200 : 401).json(resultado);

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * POST /api/auth/refresh
     * Refrescar access token
     */
    async refresh(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    message: 'Refresh token es requerido'
                });
                return;
            }

            const resultado = await authService.refreshAccessToken(refreshToken);

            res.status(resultado.success ? 200 : 401).json(resultado);

        } catch (error) {
            console.error('Error en refresh:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * POST /api/auth/logout
     * Cerrar sesión
     */
    async logout(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    message: 'Refresh token es requerido'
                });
                return;
            }

            const resultado = await authService.logout(refreshToken);

            res.status(resultado.success ? 200 : 400).json(resultado);

        } catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * GET /api/auth/me
     * Obtener usuario actual
     */
    async me(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'No autenticado'
                });
                return;
            }

            const usuario = await authService.getUserById(req.user.userId);

            if (!usuario) {
                res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
                return;
            }

            res.json({
                success: true,
                usuario
            });

        } catch (error) {
            console.error('Error en me:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

export default new AuthController();
