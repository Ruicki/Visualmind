/**
 * @file db.js
 * @description Configuración de la conexión a la base de datos PostgreSQL.
 * Implementa un pool de conexiones con soporte para múltiples entornos y lógica de reintento.
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

/**
 * Carga de variables de entorno con precaución para no sobreescribir
 * configuraciones del sistema anfitrión (ej. Railway).
 */
dotenv.config({ override: false });

/**
 * Configuración dinámica del Pool.
 * - En producción (Nube): Se prefiere `DATABASE_URL` con SSL habilitado.
 * - En desarrollo (Local): Se utilizan parámetros individuales.
 */
const poolConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: { 
        // Requerido para la mayoría de proveedores Cloud (AWS, Railway, Supabase)
        rejectUnauthorized: false 
      }
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

const pool = new Pool(poolConfig);

/**
 * connectWithRetry
 * @description Intenta establecer la conexión inicial con la base de datos.
 * En entornos de contenedores, la base de datos puede tardar más en estar lista que el servidor Express.
 * @param {number} retries Número de intentos restantes.
 * @param {number} delay Tiempo de espera entre reintentos (ms).
 */
const connectWithRetry = (retries = 5, delay = 3000) => {
  pool.connect((err, client, release) => {
    if (err) {
      if (retries > 0) {
        console.warn(`⚠️  Error conectando a PostgreSQL, reintentando en ${delay/1000}s... (${retries} intentos restantes)`);
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      } else {
        console.error('❌ Error fatal: No se pudo conectar a PostgreSQL tras varios intentos:', err.message);
      }
      return;
    }
    console.log('✅ Conexión a PostgreSQL establecida exitosamente');
    release(); // Liberar el cliente al pool
  });
};

// Iniciar proceso de conexión
connectWithRetry();

export default pool;

