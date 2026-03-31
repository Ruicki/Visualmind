import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const check = async () => {
    try {
        const res = await pool.query("SELECT count(*) FROM products");
        console.log('Products count in DB:', res.rows[0].count);
        process.exit(0);
    } catch (error) {
        console.error('Error counting products:', error);
        process.exit(1);
    }
};

check();
