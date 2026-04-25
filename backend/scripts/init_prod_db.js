/**
 * init_prod_db.js
 * Inicializa la base de datos de producción:
 *  1. Crea todas las tablas (idempotente — usa IF NOT EXISTS)
 *  2. Crea el usuario administrador si no existe
 * 
 * Uso: node scripts/init_prod_db.js
 * Requiere: DATABASE_URL en variables de entorno
 */

import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definida. Abortando inicialización.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initialize() {
  console.log('🚀 Iniciando configuración de base de datos...');
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);

  try {
    // 1. Ejecutar schema.sql (idempotente)
    const schemaPath = path.join(__dirname, '../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('📝 Ejecutando schema.sql...');
    await pool.query(schema);
    console.log('✅ Tablas verificadas/creadas.');

    // 2. Crear usuario administrador
    const email = 'visualmind@admin.com';
    const password = process.env.ADMIN_PASSWORD || 'Visualmind@14';
    
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
        [email, hashedPassword, 'Administrador Visualmind', 'admin']
      );
      console.log(`✅ Admin creado: ${email}`);
    } else {
      console.log(`ℹ️  Admin ya existe: ${email}`);
    }

    console.log('\n✨ Base de datos lista.');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('❌ Error durante la inicialización:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initialize();
