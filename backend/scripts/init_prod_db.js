/**
 * @file init_prod_db.js
 * @description Script de inicialización manual de la base de datos de producción.
 * Uso: DATABASE_URL=... [ADMIN_EMAIL=... ADMIN_PASSWORD=...] npm run db:init:prod
 * Nota: el servidor ya ejecuta esta misma lógica en cada arranque.
 */

import pg from 'pg';
import { initializeDatabase } from '../src/config/initDb.js';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  await initializeDatabase(pool);
  console.log('[InitDB] ✅ Inicialización completada exitosamente');
} catch (error) {
  console.error('[InitDB] ❌ Error durante la inicialización:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
