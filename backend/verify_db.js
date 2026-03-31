import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function verifySchema() {
    try {
        console.log('--- Verificando Conexión ---');
        const conn = await pool.connect();
        console.log('Conexión exitosa a:', process.env.DB_NAME);
        conn.release();

        console.log('\n--- Verificando Tablas ---');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tablas detectadas:', tables.rows.map(r => r.table_name).join(', '));

        console.log('\n--- Verificando Columnas de "products" ---');
        const productCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products'
            ORDER BY column_name
        `);
        productCols.rows.forEach(c => console.log(`PROD_COL: ${c.column_name} (${c.data_type})`));

        console.log('\n--- Verificando "product_variants" ---');
        const variantCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'product_variants'
            ORDER BY column_name
        `);
        variantCols.rows.forEach(c => console.log(`VAR_COL: ${c.column_name} (${c.data_type})`));
        // ... rest of the script
        process.exit(0);
    } catch (error) {
        console.error('ERROR DETALLADO:', error);
        console.error('STACK:', error.stack);
        process.exit(1);
    }
}

verifySchema();
