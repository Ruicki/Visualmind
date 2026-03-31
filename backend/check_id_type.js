import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const check = async () => {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'id'");
        if (res.rows.length > 0) {
            console.log('ID Column Type:', res.rows[0].data_type);
        } else {
            console.log('Column not found');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

check();
