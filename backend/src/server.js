/**
 * @file server.js
 * @description Punto de entrada principal del servidor Express.
 * Gestiona la configuración de seguridad, middlewares globales, ruteo de la API,
 * y la inicialización automática de la base de datos PostgreSQL.
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';
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
import subcategoryRoutes from '../routes/subcategoryRoutes.js';
import newsletterRoutes from '../routes/newsletterRoutes.js';
import { expireEvents } from '../services/eventService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

if (missingVars.length > 0) {
  console.error(`❌ Variables de entorno faltantes: ${missingVars.join(', ')}`);
  console.error('Advertencia: El servidor puede presentar fallos en operaciones críticas.');
}

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Configuraciones de Rate Limiting (Seguridad).
 * Protege endpoints sensibles contra ataques de fuerza bruta.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  skip: () => process.env.NODE_ENV !== 'production'
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutos
  max: 5,
  message: { message: 'Demasiados registros desde esta IP.' },
  skip: () => process.env.NODE_ENV !== 'production'
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
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://visualmind-one-vercel.app').split(',');

app.use(cors({
  origin: (origin, callback) => {
    // En desarrollo permitimos todo para facilitar pruebas
    if (process.env.NODE_ENV !== 'production' || !origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    console.warn(`[CORS] Petición rechazada desde origen: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parsing de cuerpos de petición
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Servidor de Archivos Estáticos (Uploads).
 * Expone la carpeta de subidas para que las imágenes sean accesibles vía URL.
 */
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


/**
 * Montaje de Rutas de la API.
 */
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/featured-products', featuredProductsRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/newsletter', newsletterRoutes);

/**
 * Endpoint: Inicialización Forzada de Admin.
 * @route GET /api/init-admin
 * @description Crea o actualiza el usuario administrador por defecto. Útil en despliegues iniciales.
 */
app.get('/api/init-admin', async (req, res) => {
  try {
    const adminEmail = 'visualmind@admin.com';
    const adminPassword = 'Visualmind@14';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
    `, [adminEmail, hashedPassword, 'Administrador Visualmind', 'admin']);
    res.json({ message: 'Admin creado/actualizado', email: adminEmail });
  } catch (error) {
    console.error('[InitAdmin] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
      message: 'Error de conexión a la BD', 
      error: error.message
    });
  }
});

/**
 * Manejador Global de Errores.
 * Centraliza la captura de excepciones para evitar fugas de información en producción.
 */
app.use((err, req, res, next) => {
  console.error('ERROR GLOBAL:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

/**
 * Inicialización del Servidor.
 */
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  
  // 1. Inicializar Esquema de Base de Datos
  try {
    await initializeDatabase();
  } catch (err) {
    console.warn('[Startup] Error al inicializar DB:', err.message);
  }
  
  // 2. Tarea Programada Inicial: Expirar eventos obsoletos
  try {
    await expireEvents();
  } catch (err) {
    console.warn('[Startup] No se pudo ejecutar el servicio de eventos:', err.message);
  }
});

/**
 * initializeDatabase
 * @description Verifica la existencia de tablas fundamentales.
 * Si no existen, ejecuta el script `schema.sql` y crea el administrador inicial.
 */
async function initializeDatabase() {
  try {
    // 1. Verificar si la tabla 'users' existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('[InitDB] Tablas no encontradas, ejecutando schema.sql...');
      const schemaPath = path.join(process.cwd(), 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log('[InitDB] Schema ejecutado correctamente');
    }

    // 2. Asegurar siempre el Administrador por defecto
    const adminEmail = 'visualmind@admin.com';
    const adminPassword = 'Visualmind@14'; // Contraseña maestra garantizada
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = EXCLUDED.password_hash, 
          role = 'admin'
    `, [adminEmail, hashedPassword, 'Administrador Visualmind', 'admin']);
    
    console.log(`[InitDB] ✅ Usuario Admin asegurado: ${adminEmail}`);

  } catch (error) {
    console.error('[InitDB] Error crítico durante la inicialización:', error.message);
    throw error;
  }
}

