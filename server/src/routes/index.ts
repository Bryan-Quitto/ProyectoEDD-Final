import { Router } from 'express';
import recommendationRoutes from './recommendationRoutes';
import courseRoutes from './courseRoutes';
import authRoutes from '../routes/authRoutes';

const router = Router();

// Configurar rutas principales
router.use('/api/recommendations', recommendationRoutes);
router.use('/api/courses', courseRoutes);

// Ruta de salud del servidor
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

export default router;