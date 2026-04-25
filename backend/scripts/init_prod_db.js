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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initialize() {
  try {
    console.log('🚀 Iniciando configuración de base de datos en producción...');

    // 1. Leer y ejecutar schema.sql
    const schemaPath = path.join(__dirname, '../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('📝 Creando tablas...');
    await pool.query(schema);
    console.log('✅ Tablas creadas exitosamente.');

    // 2. Crear usuario administrador
    const email = 'visualmind@admin.com';
    const password = 'Visualmind@14';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`👤 Creando usuario administrador: ${email}...`);
    
    // Verificar si ya existe
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userCheck.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
        [email, hashedPassword, 'Administrador Visualmind', 'admin']
      );
      console.log('✅ Usuario administrador creado con éxito.');
    } else {
      console.log('ℹ️ El usuario administrador ya existe.');
    }

    console.log('\n✨ Configuración completada con éxito.');
    console.log('Ya puedes entrar con:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
  } finally {
    await pool.end();
  }
}

initialize();
