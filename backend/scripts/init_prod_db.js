/**
 * @file init_prod_db.js
 * @description Script de inicialización de base de datos para producción (Railway).
 * Ejecuta schema.sql y crea el usuario admin por defecto.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('[InitDB] Conectando a la base de datos...');
    
    // 1. Verificar si la tabla 'users' existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('[InitDB] Tablas no encontradas, ejecutando schema.sql...');
      const schemaPath = path.join(__dirname, '..', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schema);
      console.log('[InitDB] ✅ Schema ejecutado correctamente');
    } else {
      console.log('[InitDB] ✅ Tablas ya existen');
    }

    // 2. Crear/actualizar el administrador por defecto
    const adminEmail = 'visualmind@admin.com';
    const adminPassword = 'Visualmind@14';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = EXCLUDED.password_hash, 
          role = 'admin'
    `, [adminEmail, hashedPassword, 'Administrador Visualmind', 'admin']);
    
    console.log(`[InitDB] ✅ Usuario Admin asegurado: ${adminEmail}`);
    console.log('[InitDB] ✅ Inicialización completada exitosamente');

  } catch (error) {
    console.error('[InitDB] ❌ Error durante la inicialización:', error.message);
    throw error;
  } finally {
    await client.release();
    await pool.end();
  }
}

initDatabase();