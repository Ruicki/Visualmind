import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const diagnose = async () => {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log('Columns in users table:', res.rows.map(r => r.column_name));
        process.exit(0);
    } catch (error) {
        console.error('Error diagnosing:', error);
        process.exit(1);
    }
};

diagnose();
