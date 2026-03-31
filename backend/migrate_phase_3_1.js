import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Alter products table
    console.log('Altering products table...');
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS new_arrival BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS launch_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS parent_category VARCHAR(100)
    `);

    // Create stock_logs table
    console.log('Creating stock_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
        change_amount INTEGER NOT NULL,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create coupons table
    console.log('Creating coupons table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) UNIQUE NOT NULL,
        discount_type VARCHAR(20) NOT NULL, -- 'fixed' or 'percent'
        value DECIMAL(10, 2) NOT NULL,
        expiry_date TIMESTAMP,
        usage_limit INTEGER DEFAULT 1,
        used_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Base de datos actualizada exitosamente (Fase 3.1)');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
