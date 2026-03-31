import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const migrationQuery = `
  -- Habilitar extensiÃ³n para UUID si no estÃ¡
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- 1. Asegurar tabla de productos y sus nuevos campos
  ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS new_arrival BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS launch_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS parent_category TEXT;

  -- 2. Crear tabla de variantes de producto (Usando VARCHAR para product_id para coincidir con products.id)
  CREATE TABLE IF NOT EXISTS product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id CHARACTER VARYING REFERENCES products(id) ON DELETE CASCADE,
    size TEXT,
    color TEXT,
    stock INTEGER DEFAULT 0,
    sku TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 3. Crear tabla de logs de stock (auditorÃ­a)
  CREATE TABLE IF NOT EXISTS stock_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    product_id CHARACTER VARYING REFERENCES products(id) ON DELETE CASCADE,
    change_amount INTEGER,
    reason TEXT, -- 'restock', 'sale', 'adjustment', 'return'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 4. Crear tabla de cupones
  CREATE TABLE IF NOT EXISTS coupons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL, -- 'percent', 'fixed'
    value NUMERIC NOT NULL,
    min_purchase NUMERIC DEFAULT 0,
    active BOOLEAN DEFAULT true,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 5. Crear tabla de order_items si no existe (algunas implementaciones usaban JSONB)
  CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id CHARACTER VARYING REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC NOT NULL,
    size TEXT,
    color TEXT,
    sku TEXT
  );

  -- 6. Agregar columnas a usuarios si faltan (Nombre, Apellido ya que perfiles no existe localmente como tabla separada usualmente)
  -- En este proyecto parece que 'users' es la tabla principal
  ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;
`;

async function runMigration() {
  try {
    console.log('--- Iniciando MigraciÃ³n Fase 3.1 (VersiÃ³n Final) ---');
    await pool.query(migrationQuery);
    console.log('âœ… MigraciÃ³n completada exitosamente.');
  } catch (err) {
    console.error('â Œ Error en la migraciÃ³n:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
