import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const checkSchema = async () => {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products'
        `);
        console.log('Table Schema:', res.rows);
        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
};

checkSchema();
