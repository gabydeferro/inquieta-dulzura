import './loadEnv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fotosRoutes from './routes/fotos';
import { pool } from './config/database';
import authRoutes from './routes/auth';
import categoriaRoutes from './routes/categorias';
import productoRoutes from './routes/productos';
import ingredientesRoutes from './routes/ingredientes';
import recetasRoutes from './routes/recetas';
import contenidoDigitalRouter from './controllers/ContenidoDigitalController';
import ventasRoutes from './routes/ventas';
import { authenticateToken } from './middleware/auth';

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES
// ============================================

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadsPath));

if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// RUTAS
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/ingredientes', ingredientesRoutes);
app.use('/api/recetas', recetasRoutes);
app.use('/api/contenido-digital', contenidoDigitalRouter);
app.use('/api/ventas', ventasRoutes);
app.use('/api/fotos', authenticateToken, fotosRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

interface CustomError extends Error {
  status?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: CustomError, req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL verificada');
    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
      console.log(`📁 Archivos estáticos en: ${uploadsPath}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Base de Datos: ${process.env.DB_NAME} en puerto ${process.env.DB_PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

void startServer();
