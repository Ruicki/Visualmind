import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const recreateTable = async () => {
    try {
        console.log('Dropping and recreating products table...');
        await pool.query('DROP TABLE IF EXISTS products CASCADE');
        await pool.query(`
            CREATE TABLE products (
                id VARCHAR(100) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                category VARCHAR(100),
                sub_category VARCHAR(100),
                image_url VARCHAR(255),
                sku VARCHAR(100) UNIQUE,
                stock INTEGER DEFAULT 0,
                is_new BOOLEAN DEFAULT false,
                discount DECIMAL(5, 2) DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Products table recreated successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error recreating table:', error);
        process.exit(1);
    }
};

recreateTable();
