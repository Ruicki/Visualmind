import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function checkActive() {
    try {
        const res = await pool.query(`
            SELECT name, is_active, start_date, end_date, 
            (start_date IS NULL OR start_date <= NOW()) as start_ok,
            (end_date IS NULL OR end_date >= NOW()) as end_ok
            FROM campaigns
        `);
        console.table(res.rows);
        
        const active = await pool.query(`
            SELECT name FROM campaigns 
            WHERE is_active = true 
            AND (start_date IS NULL OR start_date <= NOW()) 
            AND (end_date IS NULL OR end_date >= NOW())
        `);
        console.log("ACTUALMENTE ACTIVAS:", active.rows.map(r => r.name));
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkActive();
