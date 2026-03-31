import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'");
        console.log('Columnas en products:', res.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
