import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const migrate = async () => {
    try {
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)");
        console.log("✅ Column 'full_name' added successfully (if it didn't exist)");
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
};

migrate();
