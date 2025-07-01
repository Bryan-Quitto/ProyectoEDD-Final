import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mainRoutes from './routes';
import authRoutes from './routes/authRoutes';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://proyecto-edd-final.vercel.app'
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

app.use('/api/auth', authRoutes);

app.use('/api', mainRoutes);


app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: { message: 'Ruta no encontrada en la API', path: req.originalUrl },
  });
});

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error global:', error.stack);
  res.status(500).json({
    error: { 
      message: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  });
});


if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
  });
}

export default app;