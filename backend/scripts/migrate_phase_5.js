import pool from '../src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    console.log('--- Iniciando migración de Campañas y Ciclo de Vida ---');
    const client = await pool.connect();
    try {
        const sqlPath = path.join(__dirname, 'migrate_phase_5_campaigns.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await client.query(sql);
        console.log('✅ Migración completada con éxito.');
    } catch (err) {
        console.error('❌ Error durante la migración:', err);
    } finally {
        client.release();
        process.exit();
    }
}

runMigration();
