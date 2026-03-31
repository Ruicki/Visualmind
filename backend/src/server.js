import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pool from './config/db.js';
import authRoutes from '../routes/authRoutes.js';
import productRoutes from '../routes/productRoutes.js';
import orderRoutes from '../routes/orderRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import addressRoutes from '../routes/addressRoutes.js';


dotenv.config();

// Validación de variables de entorno críticas
if (!process.env.DATABASE_URL) {
  const REQUIRED_ENV = ['JWT_SECRET', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      console.error(`❌ Variable de entorno requerida no definida: ${key}`);
      process.exit(1);
    }
  }
} else if (!process.env.JWT_SECRET) {
  console.error(`❌ Variable de entorno requerida no definida: JWT_SECRET`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  skip: () => process.env.NODE_ENV === 'development'
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 5,
  message: { message: 'Demasiados registros desde esta IP.' },
  skip: () => process.env.NODE_ENV === 'development'
});

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without origin (e.g. Postman in dev) only in development
    if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json()); // Permite recibir JSON en el body
app.use('/uploads', express.static('uploads')); // Servir archivos estáticos

// Rutas
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/addresses', addressRoutes);



// Endpoint de prueba básico
app.get('/api/health', async (req, res) => {
  try {
    // Probamos hacer una consulta simple a la BD
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      message: 'Servidor Express funcionando 🚀',
      db_time: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error de conexión a la BD', error: error.message });
  }
});



// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
