import pool from './backend/src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function addColumn() {
    try {
        await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS hover_image_url VARCHAR(255)');
        console.log('Column hover_image_url added successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error adding column:', error);
        process.exit(1);
    }
}

addColumn();
