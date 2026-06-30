import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

/**
 * Middleware para verificar JWT y autenticar usuario
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token no proporcionado',
      });
      return;
    }

    // Verificar token
    const payload = authService.verifyAccessToken(token);

    if (!payload) {
      res.status(403).json({
        success: false,
        message: 'Token inválido o expirado',
      });
      return;
    }

    // Agregar usuario al request
    req.user = payload;
    next();
  } catch (_error) {
    console.error('Error en authenticateToken:', _error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

/**
 * Middleware opcional de autenticación
 * Permite que la ruta funcione con o sin autenticación
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = authService.verifyAccessToken(token);
      if (payload) {
        req.user = payload;
      }
    }

    next();
  } catch {
    // Continuar sin autenticación
    next();
  }
};

/**
 * Middleware para verificar rol de administrador
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'No autenticado',
    });
    return;
  }

  if (req.user.rol !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de administrador',
    });
    return;
  }

  next();
};
