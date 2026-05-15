import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: 'postgres', // Nos conectamos a la base por defecto de postgres
});

async function create() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL.');
    await client.query('CREATE DATABASE visualmind');
    console.log('✨ Base de datos "visualmind" creada exitosamente.');
  } catch (err) {
    if (err.code === '42P04') {
      console.log('ℹ️ La base de datos "visualmind" ya existe.');
    } else {
      console.error('❌ Error:', err.message);
    }
  } finally {
    await client.end();
  }
}
create();
