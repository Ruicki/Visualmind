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

    console.log('Creating seasons table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS seasons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating collections table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Updating products table...');
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS layout_preference VARCHAR(50) DEFAULT 'standard',
      ADD COLUMN IF NOT EXISTS admin_notes TEXT
    `);

    // Actualizar disparadores para updated_at if they exist, or just leave it for now
    
    await client.query('COMMIT');
    console.log('✅ Migración de Fase 6 (Dinamismo) completada exitosamente.');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante la migración de Fase 6:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
