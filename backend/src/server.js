/**
 * @file server.js
 * @description Punto de entrada principal del servidor Express.
 * Gestiona la configuración de seguridad, middlewares globales, ruteo de la API,
 * y la inicialización automática de la base de datos PostgreSQL.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import pool from './config/db.js';
import authRoutes from '../routes/authRoutes.js';
import productRoutes from '../routes/productRoutes.js';
import orderRoutes from '../routes/orderRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import addressRoutes from '../routes/addressRoutes.js';
import campaignRoutes from '../routes/campaignRoutes.js';
import collectionRoutes from '../routes/collectionRoutes.js';
import categoryRoutes from '../routes/categoryRoutes.js';
import featuredProductsRoutes from '../routes/featuredProductsRoutes.js';
import newsletterRoutes from '../routes/newsletterRoutes.js';
import { expireEvents } from '../services/eventService.js';
import { expireStalePendingOrders } from '../services/orderExpiry.js';
import { initializeDatabase } from './config/initDb.js';
import { serveUploadFromDb } from '../middleware/uploadMiddleware.js';

/**
 * Carga de variables de entorno.
 * Se utiliza `override: false` para respetar las variables definidas en plataformas PaaS (ej. Railway).
 */
dotenv.config({ override: false });

/**
 * Validación de configuración crítica.
 * Asegura que las credenciales de BD y el secreto JWT estén presentes antes de operar plenamente.
 */
const missingVars = [];
if (!process.env.DATABASE_URL) {
  const localVars = ['DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  localVars.forEach(k => { if (!process.env[k]) missingVars.push(k); });
}
if (!process.env.JWT_SECRET) missingVars.push('JWT_SECRET');

const isProduction = process.env.NODE_ENV === 'production';

if (missingVars.length > 0) {
  console.error(`❌ Variables de entorno faltantes: ${missingVars.join(', ')}`);
  console.error('Advertencia: El servidor puede presentar fallos en operaciones críticas.');
}

// En producción no se arranca sin un secreto JWT robusto: sin él nadie podría iniciar sesión
// y un secreto corto es fácil de adivinar.
if (isProduction && (process.env.JWT_SECRET || '').length < 32) {
  console.error('❌ JWT_SECRET debe tener al menos 32 caracteres en producción (p. ej. `openssl rand -hex 32`).');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Railway/Render ponen un proxy delante: sin esto todas las visitas parecen venir de la
// misma IP y el límite de intentos bloquearía a todos los clientes a la vez.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
app.disable('x-powered-by');

/**
 * Configuraciones de Rate Limiting (Seguridad).
 * Protege endpoints sensibles contra ataques de fuerza bruta.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Por IP + email: los fallos de una cuenta no bloquean a las demás
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}|${String(req.body?.email || '').trim().toLowerCase()}`,
  skipSuccessfulRequests: true,
  message: { message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  skip: () => !isProduction
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutos
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Demasiados registros desde esta IP.' },
  skip: () => !isProduction
});

const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
  skip: () => !isProduction
});

// Middleware de Registro de Peticiones (Debug)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });
}

/**
 * Middleware de CORS.
 * Configurado para permitir orígenes específicos en producción y flexibilidad en desarrollo.
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map(o => o.trim()).filter(Boolean);

// Cabeceras de seguridad. Las imágenes de /uploads se muestran desde el dominio del
// frontend (otro origen), por eso se permite cross-origin en esos recursos.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // la API solo devuelve JSON e imágenes; la CSP va en el frontend
}));

app.use(cors({
  origin: (origin, callback) => {
    // En desarrollo permitimos todo para facilitar pruebas
    if (!isProduction || !origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    console.warn(`[CORS] Petición rechazada desde origen: ${origin}`);
    callback(Object.assign(new Error('Origen no permitido'), { status: 403 }));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parsing de cuerpos de petición
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

/**
 * Servidor de Archivos Estáticos (Uploads).
 * Expone la carpeta de subidas para que las imágenes sean accesibles vía URL.
 */
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')), serveUploadFromDb);


/**
 * Montaje de Rutas de la API.
 */
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/newsletter/subscribe', newsletterLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/featured-products', featuredProductsRoutes);
app.use('/api/newsletter', newsletterRoutes);

/**
 * Endpoint: Health Check.
 * @route GET /api/health
 * @description Verifica el estado del servidor y la conectividad con la base de datos.
 */
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      message: 'Servidor Express funcionando 🚀',
      db_time: result.rows[0].now,
      env: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('[Health] DB error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Error de conexión a la BD'
    });
  }
});

/**
 * Manejador Global de Errores.
 * Centraliza la captura de excepciones para evitar fugas de información en producción.
 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message;

  if (err.type === 'entity.parse.failed') message = 'El cuerpo de la petición no es JSON válido';
  if (err.type === 'entity.too.large') message = 'La petición es demasiado grande';
  if (err.code === 'LIMIT_FILE_SIZE') { status = 413; message = 'La imagen supera el tamaño máximo (5 MB)'; }
  if (err.name === 'MulterError' && status === 500) status = 400;
  if (err.isUploadValidation) status = 400;

  if (status >= 500) console.error('ERROR GLOBAL:', err);

  res.status(status).json({
    // Los errores internos (5xx) nunca exponen detalles en producción
    error: status >= 500 && isProduction ? 'Error interno del servidor' : (message || 'Error interno del servidor'),
    ...(isProduction ? {} : { stack: err.stack })
  });
});

/**
 * Inicialización del Servidor.
 */
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  
  // 1. Inicializar Esquema de Base de Datos
  try {
    await initializeDatabase(pool);
  } catch (err) {
    console.warn('[Startup] Error al inicializar DB:', err.message);
  }
  
  // 2. Tareas periódicas: expirar campañas vencidas y liberar el stock de pedidos
  //    que nunca se pagaron. Se ejecutan al arrancar y luego cada 15 minutos.
  const runScheduledJobs = async () => {
    try {
      await expireEvents();
    } catch (err) {
      console.warn('[Jobs] No se pudo ejecutar el servicio de eventos:', err.message);
    }
    try {
      const cancelled = await expireStalePendingOrders();
      if (cancelled > 0) console.log(`[Jobs] ${cancelled} pedido(s) sin pago cancelados y stock liberado.`);
    } catch (err) {
      console.warn('[Jobs] No se pudieron vencer los pedidos pendientes:', err.message);
    }
  };
  await runScheduledJobs();
  setInterval(runScheduledJobs, 15 * 60 * 1000).unref();
});
