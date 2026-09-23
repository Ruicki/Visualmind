/**
 * @file initDb.js
 * @description Inicialización idempotente de la base de datos.
 * - Ejecuta schema.sql en cada arranque (solo usa IF NOT EXISTS, así que es seguro)
 *   para que las BD existentes reciban las columnas/tablas nuevas.
 * - Asegura que exista un administrador SIN exponer credenciales en el código de producción.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'schema.sql');

// Email del admin histórico (se usa si solo se define ADMIN_PASSWORD)
const DEFAULT_ADMIN_EMAIL = 'visualmind@admin.com';

/**
 * ensureAdmin
 * @description
 * 1. Si ADMIN_PASSWORD está definido: crea/actualiza el admin ADMIN_EMAIL
 *    (por defecto visualmind@admin.com). Sirve también para recuperar el acceso.
 * 2. Si no, y no existe ningún admin: en local (sin DATABASE_URL) crea el admin con una
 *    contraseña aleatoria que se muestra en consola; en un despliegue solo avisa.
 *    No hay contraseñas escritas en el código.
 * 3. Si ya existe un admin, no toca su contraseña.
 */
export async function ensureAdmin(db) {
  const envPassword = process.env.ADMIN_PASSWORD;
  // Si solo se definió ADMIN_PASSWORD (como en el proyecto de Railway), aplica al admin histórico
  const envEmail = process.env.ADMIN_EMAIL?.trim() || (envPassword ? DEFAULT_ADMIN_EMAIL : undefined);
  const isProd = process.env.NODE_ENV === 'production';
  // Solo se considera "local" sin DATABASE_URL (BD en la máquina del desarrollador);
  // así un despliegue que olvide NODE_ENV=production nunca recibe el admin de desarrollo.
  const isLocal = !process.env.DATABASE_URL && !isProd;

  if (envEmail && envPassword) {
    const hash = await bcrypt.hash(envPassword, 10);
    await db.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, 'admin')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'
    `, [envEmail, hash, 'Administrador Visualmind']);
    console.log(`[InitDB] ✅ Admin asegurado desde variables de entorno: ${envEmail}`);
    return;
  }

  const admins = await db.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
  if (admins.rowCount > 0) {
    if (!isLocal) {
      console.warn('[InitDB] ℹ️  ADMIN_PASSWORD no está definido: se mantiene la contraseña actual del admin.');
    }
    return;
  }

  if (!isLocal) {
    console.error('[InitDB] ⚠️  No existe ningún admin. Define ADMIN_PASSWORD (y opcionalmente ADMIN_EMAIL) y reinicia el servicio.');
    return;
  }

  const devPassword = crypto.randomBytes(9).toString('base64url');
  const hash = await bcrypt.hash(devPassword, 10);
  await db.query(`
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES ($1, $2, $3, 'admin')
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'
  `, [DEFAULT_ADMIN_EMAIL, hash, 'Administrador Visualmind']);
  console.log(`[InitDB] ✅ Admin local creado: ${DEFAULT_ADMIN_EMAIL} / ${devPassword} (define ADMIN_PASSWORD en .env para fijarla)`);
}

/**
 * initializeDatabase
 * @description Aplica schema.sql (idempotente) y asegura el admin.
 */
export async function initializeDatabase(db) {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await db.query(schema);
  console.log('[InitDB] ✅ Esquema verificado/actualizado');
  await ensureAdmin(db);
}
