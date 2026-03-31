import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const listTables = async () => {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables in DB:', res.rows.map(r => r.table_name));
        process.exit(0);
    } catch (error) {
        console.error('Error listing tables:', error);
        process.exit(1);
    }
};

listTables();
