import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import {
    Usuario,
    UsuarioSinPassword,
    AuthTokens,
    LoginCredentials,
    RegisterData,
    JWTPayload,
    RefreshToken
} from '../models/Usuario';

export class AuthService {
    private static readonly SALT_ROUNDS = 10;
    private static readonly ACCESS_TOKEN_EXPIRES = '15m';
    private static readonly REFRESH_TOKEN_EXPIRES_DAYS = 7;

    /**
     * Registrar un nuevo usuario
     */
    async register(data: RegisterData): Promise<{
        success: boolean;
        usuario?: UsuarioSinPassword;
        tokens?: AuthTokens;
        message: string;
    }> {
        try {
            // Verificar si el email ya existe
            const [existing] = await pool.execute<RowDataPacket[]>(
                'SELECT id FROM usuarios WHERE email = ?',
                [data.email]
            );

            if (existing.length > 0) {
                return {
                    success: false,
                    message: 'El email ya está registrado'
                };
            }

            // Hashear contraseña
            const passwordHash = await bcrypt.hash(data.password, AuthService.SALT_ROUNDS);

            // Insertar usuario
            const [result] = await pool.execute<ResultSetHeader>(
                `INSERT INTO usuarios (email, password_hash, nombre, rol) 
         VALUES (?, ?, ?, 'usuario')`,
                [data.email, passwordHash, data.nombre]
            );

            const usuarioId = result.insertId;

            // Obtener usuario creado
            const [usuarios] = await pool.execute<RowDataPacket[]>(
                'SELECT id, email, nombre, rol, activo, created_at, updated_at FROM usuarios WHERE id = ?',
                [usuarioId]
            );

            const usuario = usuarios[0] as UsuarioSinPassword;

            // Generar tokens
            const tokens = await this.generateTokens(usuario);

            return {
                success: true,
                usuario,
                tokens,
                message: 'Usuario registrado exitosamente'
            };

        } catch (error) {
            console.error('Error en register:', error);
            return {
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
            };
        }
    }

    /**
     * Iniciar sesión
     */
    async login(credentials: LoginCredentials): Promise<{
        success: boolean;
        usuario?: UsuarioSinPassword;
        tokens?: AuthTokens;
        message: string;
    }> {
        try {
            // Buscar usuario por email
            const [usuarios] = await pool.execute<RowDataPacket[]>(
                'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
                [credentials.email]
            );

            if (usuarios.length === 0) {
                return {
                    success: false,
                    message: 'Credenciales inválidas'
                };
            }

            const usuario = usuarios[0] as Usuario;

            // Verificar contraseña
            const passwordMatch = await bcrypt.compare(
                credentials.password,
                usuario.password_hash
            );

            if (!passwordMatch) {
                return {
                    success: false,
                    message: 'Credenciales inválidas'
                };
            }

            // Actualizar último login
            await pool.execute(
                'UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?',
                [usuario.id]
            );

            // Generar tokens
            const tokens = await this.generateTokens(usuario);

            // Eliminar password_hash del objeto
            const { password_hash, ...usuarioSinPassword } = usuario;

            return {
                success: true,
                usuario: usuarioSinPassword,
                tokens,
                message: 'Login exitoso'
            };

        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
            };
        }
    }

    /**
     * Refrescar access token
     */
    async refreshAccessToken(refreshToken: string): Promise<{
        success: boolean;
        accessToken?: string;
        message: string;
    }> {
        try {
            // Verificar que el refresh token existe y no ha expirado
            const [tokens] = await pool.execute<RowDataPacket[]>(
                `SELECT rt.*, u.id, u.email, u.rol 
         FROM refresh_tokens rt
         INNER JOIN usuarios u ON rt.usuario_id = u.id
         WHERE rt.token = ? AND rt.expires_at > NOW() AND u.activo = TRUE`,
                [refreshToken]
            );

            if (tokens.length === 0) {
                return {
                    success: false,
                    message: 'Refresh token inválido o expirado'
                };
            }

            const tokenData = tokens[0];

            // Generar nuevo access token
            const accessToken = this.generateAccessToken({
                userId: tokenData.id,
                email: tokenData.email,
                rol: tokenData.rol
            });

            return {
                success: true,
                accessToken,
                message: 'Token refrescado exitosamente'
            };

        } catch (error) {
            console.error('Error en refreshAccessToken:', error);
            return {
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
            };
        }
    }

    /**
     * Cerrar sesión (invalidar refresh token)
     */
    async logout(refreshToken: string): Promise<{
        success: boolean;
        message: string;
    }> {
        try {
            await pool.execute(
                'DELETE FROM refresh_tokens WHERE token = ?',
                [refreshToken]
            );

            return {
                success: true,
                message: 'Logout exitoso'
            };

        } catch (error) {
            console.error('Error en logout:', error);
            return {
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
            };
        }
    }

    /**
     * Verificar access token
     */
    verifyAccessToken(token: string): JWTPayload | null {
        try {
            const secret = process.env.JWT_SECRET || 'secret-key-change-in-production';
            const decoded = jwt.verify(token, secret) as JWTPayload;
            return decoded;
        } catch (error) {
            return null;
        }
    }

    /**
     * Obtener usuario por ID
     */
    async getUserById(userId: number): Promise<UsuarioSinPassword | null> {
        try {
            const [usuarios] = await pool.execute<RowDataPacket[]>(
                'SELECT id, email, nombre, rol, activo, ultimo_login, created_at, updated_at FROM usuarios WHERE id = ?',
                [userId]
            );

            return usuarios.length > 0 ? (usuarios[0] as UsuarioSinPassword) : null;

        } catch (error) {
            console.error('Error en getUserById:', error);
            return null;
        }
    }

    /**
     * Limpiar refresh tokens expirados
     */
    async cleanExpiredTokens(): Promise<number> {
        try {
            const [result] = await pool.execute<ResultSetHeader>(
                'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
            );

            return result.affectedRows;

        } catch (error) {
            console.error('Error en cleanExpiredTokens:', error);
            return 0;
        }
    }

    // ========================================
    // MÉTODOS PRIVADOS
    // ========================================

    private async generateTokens(usuario: Usuario | UsuarioSinPassword): Promise<AuthTokens> {
        const payload: JWTPayload = {
            userId: usuario.id,
            email: usuario.email,
            rol: usuario.rol
        };

        // Generar access token
        const accessToken = this.generateAccessToken(payload);

        // Generar refresh token
        const refreshToken = this.generateRefreshToken();

        // Guardar refresh token en BD
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + AuthService.REFRESH_TOKEN_EXPIRES_DAYS);

        await pool.execute(
            'INSERT INTO refresh_tokens (usuario_id, token, expires_at) VALUES (?, ?, ?)',
            [usuario.id, refreshToken, expiresAt]
        );

        return {
            accessToken,
            refreshToken
        };
    }

    private generateAccessToken(payload: JWTPayload): string {
        const secret = process.env.JWT_SECRET || 'secret-key-change-in-production';
        return jwt.sign(payload, secret, {
            expiresIn: AuthService.ACCESS_TOKEN_EXPIRES
        });
    }

    private generateRefreshToken(): string {
        // Generar token aleatorio seguro
        const randomBytes = require('crypto').randomBytes(64);
        return randomBytes.toString('hex');
    }
}

export default new AuthService();
