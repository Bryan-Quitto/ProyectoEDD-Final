import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mainRoutes from './routes'; // Renombrado para claridad
import authRoutes from './routes/authRoutes'; // Importamos las rutas de auth por separado
import { authMiddleware } from './middleware/authMiddleware';

const app = express();

// --- FIX 1: Configuración de CORS para producción ---
const allowedOrigins = [
  'http://localhost:5173',
  'https://proyecto-edd-final.vercel.app' // Añadimos la URL del frontend
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// --- FIX 2: Separación de rutas públicas y protegidas ---
// Rutas públicas de autenticación (SIN el authMiddleware)
app.use('/api/auth', authRoutes);

// El resto de las rutas de la API (ESTAS SÍ están protegidas por el authMiddleware)
app.use('/api', authMiddleware, mainRoutes);


// Manejador para rutas no encontradas
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: { message: 'Ruta no encontrada en la API', path: req.originalUrl },
  });
});

// Manejador de errores global
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error global:', error.stack);
  res.status(500).json({
    error: { 
      message: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  });
});


// --- FIX 3: El app.listen() se elimina en producción ---
// El 'export default' es lo único que Vercel necesita.
// La siguiente sección solo se ejecutará si NO estás en Vercel.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
  });
}

export default app;