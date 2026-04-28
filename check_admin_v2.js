import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../../backend/.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkAdmin() {
    try {
        const res = await pool.query('SELECT id, email, role FROM users WHERE email = $1', ['visualmind@admin.com']);
        if (res.rows.length === 0) {
            console.log('Admin user NOT found in database.');
        } else {
            console.log('Admin user found:', res.rows[0]);
        }
    } catch (err) {
        console.error('Error checking admin:', err);
    } finally {
        await pool.end();
    }
}

checkAdmin();
