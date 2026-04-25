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
import seasonRoutes from '../routes/seasonRoutes.js';
import collectionRoutes from '../routes/collectionRoutes.js';
import { expireSeasons } from '../services/seasonService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


dotenv.config({ override: false }); // No sobreescribir variables ya definidas en el entorno (Railway)

// Validación de variables de entorno críticas
const missingVars = [];
if (!process.env.DATABASE_URL) {
  const localVars = ['DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  localVars.forEach(k => { if (!process.env[k]) missingVars.push(k); });
}
if (!process.env.JWT_SECRET) missingVars.push('JWT_SECRET');

if (missingVars.length > 0) {
  console.error(`❌ Variables de entorno faltantes: ${missingVars.join(', ')}`);
  console.error('El servidor puede no funcionar correctamente.');
  // No hacemos process.exit(1) para que Railway no crashee en el health check
}

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  skip: () => process.env.NODE_ENV !== 'production'
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 5,
  message: { message: 'Demasiados registros desde esta IP.' },
  skip: () => process.env.NODE_ENV !== 'production'
});

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

app.use(cors({
  origin: (origin, callback) => {
    // En desarrollo permitimos todo para evitar bloqueos por localhost vs 127.0.0.1 o puertos dinámicos
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`[CORS] Petición rechazada desde origen: ${origin}`);
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
app.use('/api/campaigns', campaignRoutes);
app.use('/api/seasons', seasonRoutes);
app.use('/api/collections', collectionRoutes);



// Endpoint de prueba básico
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
      error: error.message,
      has_db_url: !!process.env.DATABASE_URL,
      has_jwt: !!process.env.JWT_SECRET
    });
  }
});



// Endpoint temporal para crear/resetear admin
app.get('/api/init-admin', async (req, res) => {
  try {
    const adminEmail = 'visualmind@admin.com';
    const adminPassword = 'Visualmind@14';
    
    // Siempre recrear el admin con la contraseña correcta
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Upsert: actualizar si existe, insertar si no
    await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role
    `, [adminEmail, hashedPassword, 'Administrador Visualmind', 'admin']);
    
    res.json({ message: 'Admin creado/actualizado', email: adminEmail, password: adminPassword });
  } catch (error) {
    console.error('[InitAdmin] Error:', error);
    res.status(500).json({ error: error.message });
  }
});



// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  
  // Inicializar base de datos si es necesario
  try {
    await initializeDatabase();
  } catch (err) {
    console.warn('[Startup] Error al inicializar DB:', err.message);
  }
  
  // Ejecutar servicio de expiración de temporadas al arrancar
  try {
    await expireSeasons();
  } catch (err) {
    // No crítico: si falla no bloqueamos el servidor
    console.warn('[Startup] No se pudo ejecutar el servicio de temporadas:', err.message);
  }
});

// Función para inicializar la base de datos automáticamente
async function initializeDatabase() {
  try {
    // Verificar si la tabla users existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('[InitDB] Tablas no encontradas, ejecutando schema.sql...');
      
      // Ejecutar schema.sql
      const schemaPath = path.join(process.cwd(), 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log('[InitDB] Schema ejecutado correctamente');
      
      // Crear usuario admin si no existe
      const adminEmail = 'visualmind@admin.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Visualmind@14';
      
      const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
      if (adminCheck.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await pool.query(
          'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
          [adminEmail, hashedPassword, 'Administrador Visualmind', 'admin']
        );
        console.log(`[InitDB] Admin creado: ${adminEmail}`);
      }
    }
  } catch (error) {
    console.error('[InitDB] Error:', error.message);
    throw error;
  }
}
