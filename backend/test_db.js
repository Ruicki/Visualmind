import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        const res = await pool.query('SELECT DISTINCT category FROM products');
        console.log('Categorías encontradas en DB:', res.rows);
        
        const res2 = await pool.query('SELECT id, title, category FROM products LIMIT 5');
        console.log('Muestra de productos:', res2.rows);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
