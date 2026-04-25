import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la conexión a PostgreSQL
// Soporta tanto una URL completa (estándar en la nube) como parámetros individuales (local)
const poolConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

const pool = new Pool(poolConfig);

// Probar la conexión al iniciar (con retry para Railway donde la DB puede tardar)
const connectWithRetry = (retries = 5, delay = 3000) => {
  pool.connect((err, client, release) => {
    if (err) {
      if (retries > 0) {
        console.warn(`⚠️  Error conectando a PostgreSQL, reintentando en ${delay/1000}s... (${retries} intentos restantes)`);
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      } else {
        console.error('❌ No se pudo conectar a PostgreSQL después de varios intentos:', err.message);
      }
      return;
    }
    console.log('✅ Conexión a PostgreSQL establecida exitosamente');
    release();
  });
};

connectWithRetry();

export default pool;
